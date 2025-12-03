import http.server
import socketserver
import webbrowser
import threading
import time
import os
import subprocess

HTTP_PORT = 8000
JSON_PORT = 3001

def start_json_server():
    """Запускає JSON сервер"""
    try:
        print("📊 Запускаю JSON сервер...")
        
        cmd = f"json-server --watch db.json --port {JSON_PORT}"
        
        def run_json_server():
            subprocess.run(cmd, shell=True)
        
        thread = threading.Thread(target=run_json_server, daemon=True)
        thread.start()
        
        time.sleep(3)
        print(f"✅ JSON API: http://localhost:{JSON_PORT}")
        return True
        
    except Exception as e:
        print(f"❌ Помилка: {e}")
        return False

def main():
    print("🚀 Запуск Медіа-каталогу...")
    
    if not os.path.exists("db.json"):
        with open("db.json", "w", encoding="utf-8") as f:
            f.write('{"media": []}')
        print("📁 Створено db.json")
    
    start_json_server()
    
    print(f"🌐 Веб-сервер: http://localhost:{HTTP_PORT}")
    print("📚 Відкриваю каталог...")
    
    time.sleep(2)
    webbrowser.open(f"http://localhost:{HTTP_PORT}/catalog.html")
    
    with socketserver.TCPServer(("", HTTP_PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print("✅ Сервер запущено! Ctrl+C для зупинки")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер зупинено")

if __name__ == "__main__":
    main()
