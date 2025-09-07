// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use std::thread;
use std::time::Duration;
use reqwest;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct BrowserStatus {
    initialized: bool,
    naver_login_status: bool,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginResponse {
    result: bool,
    msg: String,
    usernum: Option<String>,
}

// 전역 브라우저 상태
static BROWSER_STATUS: Mutex<Option<BrowserStatus>> = Mutex::new(None);

// 전역 사용자 ID 저장
static USER_ID: Mutex<Option<String>> = Mutex::new(None);
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn login(email: &str, password: &str, remember: bool) -> Result<bool, String> {
    println!("Login attempt - Email: {}, Remember: {}", email, remember);
    
    let client = reqwest::Client::new();
    
    let json_body = serde_json::json!({
        "userid": email,
        "userpwd": password,
        "version": "1.5.3"
    });
    
    match client.post("https://selltkey.com/scb/api/getLoginInfo.asp")
        .header("Content-Type", "application/json")
        .json(&json_body)
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<LoginResponse>().await {
                Ok(login_result) => {
                    if login_result.result {
                        // 로그인 성공 - 사용자 ID를 메모리에 저장
                        if let Some(user_num) = login_result.usernum {
                            if let Ok(mut stored_user_id) = USER_ID.lock() {
                                *stored_user_id = Some(user_num.clone());
                                println!("사용자 ID 저장됨: {}", user_num);
                            }
                        }
                        
                        if remember {
                            println!("자동 로그인 설정 저장");
                        }
                        
                        println!("로그인 성공: {}", login_result.msg);
                        Ok(true)
                    } else {
                        println!("로그인 실패: {}", login_result.msg);
                        Ok(false)
                    }
                },
                Err(e) => {
                    println!("응답 파싱 실패: {}", e);
                    Err(format!("서버 응답 처리 중 오류가 발생했습니다: {}", e))
                }
            }
        },
        Err(e) => {
            println!("API 호출 실패: {}", e);
            Err(format!("로그인 서버에 연결할 수 없습니다: {}", e))
        }
    }
}

#[tauri::command]
fn logout() -> Result<(), String> {
    println!("User logged out");
    
    // 저장된 사용자 ID 삭제
    if let Ok(mut stored_user_id) = USER_ID.lock() {
        *stored_user_id = None;
        println!("사용자 ID 삭제됨");
    }
    
    Ok(())
}

#[tauri::command]
fn get_user_id() -> Result<Option<String>, String> {
    match USER_ID.lock() {
        Ok(user_id) => Ok(user_id.clone()),
        Err(e) => Err(format!("사용자 ID 조회 실패: {}", e))
    }
}

#[tauri::command]
fn check_auth() -> Result<bool, String> {
    // TODO: 실제로는 여기서 저장된 인증 정보 확인
    // 지금은 항상 false 리턴 (로그인되지 않은 상태)
    Ok(false)
}

#[tauri::command]
async fn initialize_browser() -> Result<bool, String> {
    println!("브라우저 초기화 시작...");
    
    // Node.js 스크립트 실행을 위한 명령어 생성
    let mut cmd = Command::new("node")
        .arg("-e")
        .arg(r#"
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        
        puppeteer.use(StealthPlugin());
        
        (async () => {
            try {
                console.log('Puppeteer 브라우저 실행 시작...');
                
                const browser = await puppeteer.launch({
                    headless: false,
                    defaultViewport: null,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-web-security',
                        '--no-first-run',
                        '--disable-extensions',
                        '--window-size=1200,800'
                    ],
                    ignoreDefaultArgs: ['--enable-automation']
                });
                
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                
                // 네이버 메인 페이지로 이동 (사용자가 직접 로그인 페이지로 갈 수 있도록)
                await page.goto('https://www.naver.com');
                
                console.log('브라우저 초기화 완료 - 네이버 로그인 페이지 로드됨');
                
                // 브라우저를 열린 상태로 유지하고 로그인 상태 모니터링
                setInterval(async () => {
                    try {
                        const url = page.url();
                        const cookies = await page.evaluate(() => document.cookie);
                        
                        const isNaverDomain = url.includes('naver.com');
                        const hasSessionCookie = cookies.includes('NID_SES=');
                        const isNotLoginPage = !url.includes('nidlogin.login');
                        
                        const isLoggedIn = isNaverDomain && hasSessionCookie && isNotLoginPage;
                        
                        // 상세 디버깅 정보 출력
                        console.log('=== 네이버 로그인 체크 ===');
                        console.log('현재 URL:', url);
                        console.log('네이버 도메인:', isNaverDomain);
                        console.log('세션 쿠키 존재:', hasSessionCookie);
                        console.log('로그인 페이지 아님:', isNotLoginPage);
                        console.log('최종 로그인 상태:', isLoggedIn);
                        console.log('쿠키 (일부):', cookies.substring(0, 100) + '...');
                        
                        // 로그인 상태를 파일로 저장
                        const fs = require('fs');
                        const statusFile = '/tmp/naver_login_status.json';
                        const status = {
                            isLoggedIn: isLoggedIn,
                            timestamp: Date.now(),
                            url: url,
                            debug: {
                                isNaverDomain: isNaverDomain,
                                hasSessionCookie: hasSessionCookie,
                                isNotLoginPage: isNotLoginPage
                            }
                        };
                        
                        fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
                        
                        if (isLoggedIn) {
                            console.log('🎉 네이버 로그인 감지됨!');
                        }
                        
                    } catch (error) {
                        console.error('로그인 상태 체크 오류:', error);
                    }
                }, 5000); // 5초마다 체크 (빈도 조금 낮춤)
                
            } catch (error) {
                console.error('브라우저 초기화 실패:', error.message);
                process.exit(1);
            }
        })();
        "#)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn();
    
    match cmd {
        Ok(mut child) => {
            // 비동기적으로 프로세스 실행
            thread::spawn(move || {
                match child.wait() {
                    Ok(status) => {
                        if status.success() {
                            println!("브라우저 프로세스 성공적으로 시작됨");
                        } else {
                            println!("브라우저 프로세스 실패: {:?}", status);
                        }
                    }
                    Err(e) => println!("브라우저 프로세스 대기 실패: {}", e),
                }
            });
            
            // 상태 업데이트
            if let Ok(mut status) = BROWSER_STATUS.lock() {
                *status = Some(BrowserStatus {
                    initialized: true,
                    naver_login_status: false,
                    error: None,
                });
            }
            
            println!("브라우저 초기화 완료");
            Ok(true)
        }
        Err(e) => {
            println!("브라우저 실행 실패: {}", e);
            
            // 에러 상태 업데이트
            if let Ok(mut status) = BROWSER_STATUS.lock() {
                *status = Some(BrowserStatus {
                    initialized: false,
                    naver_login_status: false,
                    error: Some(e.to_string()),
                });
            }
            
            Err(format!("브라우저 실행 실패: {}", e))
        }
    }
}

#[tauri::command]
fn get_browser_status() -> Result<BrowserStatus, String> {
    match BROWSER_STATUS.lock() {
        Ok(status) => {
            match &*status {
                Some(s) => Ok(s.clone()),
                None => Ok(BrowserStatus {
                    initialized: false,
                    naver_login_status: false,
                    error: None,
                })
            }
        }
        Err(e) => Err(format!("상태 조회 실패: {}", e))
    }
}

#[tauri::command]
async fn check_naver_login() -> Result<bool, String> {
    use std::fs;
    
    let status_file = "/tmp/naver_login_status.json";
    
    match fs::read_to_string(status_file) {
        Ok(content) => {
            match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(status) => {
                    let is_logged_in = status["isLoggedIn"].as_bool().unwrap_or(false);
                    let timestamp = status["timestamp"].as_u64().unwrap_or(0);
                    
                    // 타임스탬프가 30초 이내인 경우만 유효한 상태로 간주
                    let current_time = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64;
                        
                    let is_recent = (current_time - timestamp) < 30000; // 30초
                    
                    let final_result = is_logged_in && is_recent;
                    
                    println!("네이버 로그인 상태: {} (최신: {})", is_logged_in, is_recent);
                    
                    // 로그인 상태를 브라우저 상태에도 반영
                    if let Ok(mut browser_status) = BROWSER_STATUS.lock() {
                        if let Some(ref mut status) = browser_status.as_mut() {
                            status.naver_login_status = final_result;
                        }
                    }
                    
                    Ok(final_result)
                },
                Err(_) => {
                    println!("상태 파일 파싱 실패");
                    Ok(false)
                }
            }
        },
        Err(_) => {
            println!("상태 파일을 읽을 수 없음");
            Ok(false)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, login, logout, check_auth, get_user_id, initialize_browser, get_browser_status, check_naver_login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
