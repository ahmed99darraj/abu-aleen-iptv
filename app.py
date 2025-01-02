from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# رابط قائمة القنوات
PLAYLIST_URL = 'https://leotv.xyz:80/get.php?username=0855583595&password=4820244090&type=m3u_plus&output=ts'

def parse_m3u(content):
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
                
                if 'tvg-logo="' in metadata:
                    logo = metadata.split('tvg-logo="')[1].split('"')[0]
                
                if 'group-title="' in metadata:
                    group = metadata.split('group-title="')[1].split('"')[0]
                
                current_channel = {
                    'name': name,
                    'logo': logo,
                    'group': group,
                    'url': ''
                }
        elif line.startswith('http'):
            if current_channel:
                current_channel['url'] = line
                channels.append(current_channel)
                current_channel = None
    
    return channels

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)

@app.route('/api/channels')
def get_channels():
    try:
        response = requests.get(PLAYLIST_URL)
        channels = parse_m3u(response.text)
        
        # تنظيم القنوات حسب المجموعات
        groups = {}
        for channel in channels:
            group = channel['group'] or 'أخرى'
            if group not in groups:
                groups[group] = []
            groups[group].append(channel)
        
        return jsonify({
            'groups': list(groups.keys()),
            'channels': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
