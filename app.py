from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# قوائم التشغيل المتاحة
PLAYLISTS = {
    'arabic': 'https://iptv-org.github.io/iptv/languages/ara.m3u',
    'sports': 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    'news': 'https://iptv-org.github.io/iptv/categories/news.m3u',
    'movies': 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    'kids': 'https://iptv-org.github.io/iptv/categories/kids.m3u'
}

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
                categories = []
                
                if 'tvg-logo="' in metadata:
                    logo = metadata.split('tvg-logo="')[1].split('"')[0]
                
                if 'group-title="' in metadata:
                    category = metadata.split('group-title="')[1].split('"')[0]
                    categories.append(category)
                
                current_channel = {
                    'name': name,
                    'logo': logo,
                    'categories': categories,
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

@app.route('/api/playlists')
def get_playlists():
    return jsonify(list(PLAYLISTS.keys()))

@app.route('/api/channels/<playlist>')
def get_channels(playlist):
    if playlist not in PLAYLISTS:
        return jsonify({'error': 'Playlist not found'}), 404
    
    try:
        response = requests.get(PLAYLISTS[playlist])
        channels = parse_m3u(response.text)
        return jsonify(channels)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
