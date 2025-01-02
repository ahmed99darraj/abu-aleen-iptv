from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
import logging
from datetime import datetime, timedelta
import threading
import time

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# تعطيل تحذيرات SSL
requests.packages.urllib3.disable_warnings()

# رابط قائمة القنوات
PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.language.m3u'

# التخزين المؤقت
cache = {
    'channels': None,
    'last_update': None,
    'updating': False
}

def update_channels_cache():
    """تحديث التخزين المؤقت للقنوات"""
    if cache['updating']:
        return
    
    try:
        cache['updating'] = True
        logger.info('Updating channels cache...')
        
        is_valid, content = check_playlist_url()
        if is_valid:
            channels = parse_m3u(content)
            if channels:
                # تنظيم القنوات حسب المجموعات
                groups = {}
                for channel in channels:
                    group = channel['group'] or 'أخرى'
                    if group not in groups:
                        groups[group] = []
                    groups[group].append(channel)
                
                # ترتيب المجموعات
                sorted_groups = sorted(groups.keys())
                if 'Arabic' in sorted_groups:
                    sorted_groups.remove('Arabic')
                    sorted_groups.insert(0, 'Arabic')
                
                cache['channels'] = {
                    'groups': sorted_groups,
                    'channels': groups
                }
                cache['last_update'] = datetime.now()
                logger.info(f'Cache updated successfully with {len(channels)} channels')
            else:
                logger.error('No channels found during cache update')
        else:
            logger.error(f'Invalid playlist during cache update: {content}')
    except Exception as e:
        logger.error(f'Error updating cache: {str(e)}')
    finally:
        cache['updating'] = False

def check_playlist_url():
    """التحقق من صلاحية رابط القائمة"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(PLAYLIST_URL, headers=headers, verify=False, timeout=10)
        logger.info(f'Playlist URL response status: {response.status_code}')
        
        if response.status_code == 200:
            content = response.text
            if '#EXTM3U' in content:
                return True, content
            logger.error('Response does not contain valid M3U content')
            return False, 'الرابط لا يحتوي على قائمة قنوات صالحة'
        
        logger.error(f'Invalid response status code: {response.status_code}')
        return False, f'خطأ في الوصول للرابط: {response.status_code}'
    except requests.Timeout:
        logger.error('Request timeout')
        return False, 'انتهت مهلة الاتصال بالخادم'
    except requests.RequestException as e:
        logger.error(f'Request error: {str(e)}')
        return False, f'خطأ في الوصول للرابط: {str(e)}'
    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}')
        return False, 'حدث خطأ غير متوقع'

def parse_m3u(content):
    """تحليل محتوى ملف M3U"""
    try:
        channels = []
        current_channel = None
        
        for line in content.splitlines():
            if line.startswith('#EXTINF:'):
                info = line.split(',', 1)
                if len(info) > 1:
                    name = info[1]
                    metadata = info[0]
                    logo = ''
                    group = ''
                    language = ''
                    
                    if 'tvg-logo="' in metadata:
                        logo = metadata.split('tvg-logo="')[1].split('"')[0]
                    
                    if 'group-title="' in metadata:
                        group = metadata.split('group-title="')[1].split('"')[0]
                        
                    if 'language="' in metadata:
                        language = metadata.split('language="')[1].split('"')[0]
                    elif '[' in name and ']' in name:
                        language = name[name.find('[')+1:name.find(']')]
                    
                    current_channel = {
                        'name': name.split('[')[0].strip() if '[' in name else name,
                        'logo': logo,
                        'group': language or group or 'أخرى',
                        'url': ''
                    }
            elif line.startswith('http'):
                if current_channel:
                    current_channel['url'] = line
                    channels.append(current_channel)
                    current_channel = None
        
        return channels
    except Exception as e:
        logger.error(f'Error parsing M3U: {str(e)}')
        return None

def start_background_update():
    """تحديث القنوات في الخلفية"""
    while True:
        if not cache['last_update'] or \
           datetime.now() - cache['last_update'] > timedelta(hours=1):
            update_channels_cache()
        time.sleep(3600)  # تحديث كل ساعة

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)

@app.route('/api/check-playlist')
def check_playlist():
    """التحقق من صلاحية القائمة"""
    try:
        # إذا كان لدينا تخزين مؤقت حديث، نعتبر القائمة صالحة
        if cache['channels'] and \
           cache['last_update'] and \
           datetime.now() - cache['last_update'] < timedelta(hours=1):
            return jsonify({
                'valid': True,
                'message': 'القائمة صالحة'
            })
        
        is_valid, message = check_playlist_url()
        if is_valid and not cache['channels']:
            # تحديث التخزين المؤقت إذا كان فارغاً
            threading.Thread(target=update_channels_cache).start()
            
        return jsonify({
            'valid': is_valid,
            'message': message
        })
    except Exception as e:
        logger.error(f'Error in check_playlist: {str(e)}')
        return jsonify({
            'valid': False,
            'message': str(e)
        }), 500

@app.route('/api/channels')
def get_channels():
    """الحصول على قائمة القنوات"""
    try:
        # إذا كان التخزين المؤقت فارغاً، نقوم بتحديثه
        if not cache['channels']:
            if not cache['updating']:
                threading.Thread(target=update_channels_cache).start()
            return jsonify({'error': 'جاري تحميل القنوات، يرجى المحاولة بعد قليل'}), 503
        
        # إذا مر وقت طويل على آخر تحديث، نقوم بالتحديث في الخلفية
        if cache['last_update'] and \
           datetime.now() - cache['last_update'] > timedelta(hours=1) and \
           not cache['updating']:
            threading.Thread(target=update_channels_cache).start()
        
        return jsonify(cache['channels'])
    except Exception as e:
        logger.error(f'Error in get_channels: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # بدء تحديث القنوات في الخلفية
    threading.Thread(target=start_background_update, daemon=True).start()
    
    # تحديث القنوات عند بدء التشغيل
    update_channels_cache()
    
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=True)
