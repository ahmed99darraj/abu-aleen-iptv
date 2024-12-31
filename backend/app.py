from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# قوائم التشغيل المتاحة
PLAYLISTS = {
    # iptv-org playlists
    'all': 'https://iptv-org.github.io/iptv/index.m3u',
    'arabic': 'https://iptv-org.github.io/iptv/languages/ara.m3u',
    'english': 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    'sports': 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    'movies': 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    'news': 'https://iptv-org.github.io/iptv/categories/news.m3u',
    'kids': 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    'music': 'https://iptv-org.github.io/iptv/categories/music.m3u',
    
    # Free-TV playlists
    'free_all': 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    'free_arabic': 'https://raw.githubusercontent.com/Free-TV/IPTV/master/countries/sa.m3u8',
    'free_sports': 'https://raw.githubusercontent.com/Free-TV/IPTV/master/categories/sports.m3u8',
    
    # Additional playlists
    'samsung_plus': 'https://i.mjh.nz/SamsungTVPlus/all.m3u8',
    'pluto_tv': 'https://i.mjh.nz/PlutoTV/all.m3u8',
    'rakuten_tv': 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist_rakuten.m3u8',
    
    # Regional playlists
    'usa': 'https://iptv-org.github.io/iptv/countries/us.m3u',
    'uk': 'https://iptv-org.github.io/iptv/countries/gb.m3u',
    'france': 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    'germany': 'https://iptv-org.github.io/iptv/countries/de.m3u',
    'italy': 'https://iptv-org.github.io/iptv/countries/it.m3u',
    'spain': 'https://iptv-org.github.io/iptv/countries/es.m3u',
    'india': 'https://iptv-org.github.io/iptv/countries/in.m3u',
    'china': 'https://iptv-org.github.io/iptv/countries/cn.m3u',
    'japan': 'https://iptv-org.github.io/iptv/countries/jp.m3u',
    'korea': 'https://iptv-org.github.io/iptv/countries/kr.m3u',
    
    # Additional categories
    'documentary': 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    'entertainment': 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    'family': 'https://iptv-org.github.io/iptv/categories/family.m3u',
    'lifestyle': 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u',
    'science': 'https://iptv-org.github.io/iptv/categories/science.m3u',
    'education': 'https://iptv-org.github.io/iptv/categories/education.m3u'
}

def parse_m3u(content):
    channels = []
    lines = content.split('\n')
    current_channel = None
    
    for line in lines:
        if line.startswith('#EXTINF:'):
            # Parse channel info
            info = line.split(',', 1)
            if len(info) > 1:
                name = info[1].strip()
                current_channel = {'name': name, 'categories': []}
                
                # Extract categories from name and metadata
                if 'tvg-group' in line:
                    group = line.split('tvg-group="')[1].split('"')[0]
                    current_channel['categories'].append(group)
                else:
                    # Fallback category detection
                    if any(word in name.lower() for word in ['news', 'أخبار']):
                        current_channel['categories'].append('News')
                    elif any(word in name.lower() for word in ['sport', 'رياضة']):
                        current_channel['categories'].append('Sports')
                    elif any(word in name.lower() for word in ['kids', 'أطفال', 'cartoon']):
                        current_channel['categories'].append('Kids')
                    elif any(word in name.lower() for word in ['movie', 'cinema', 'أفلام']):
                        current_channel['categories'].append('Movies')
                    elif any(word in name.lower() for word in ['music', 'موسيقى']):
                        current_channel['categories'].append('Music')
                    else:
                        current_channel['categories'].append('General')
                
                # Extract logo if available
                if 'tvg-logo' in line:
                    logo = line.split('tvg-logo="')[1].split('"')[0]
                    current_channel['logo'] = logo
                    
        elif line.startswith('http'):
            if current_channel:
                current_channel['url'] = line.strip()
                channels.append(current_channel)
                current_channel = None
                
    return channels

@app.route('/api/playlists')
def get_playlists():
    return jsonify(list(PLAYLISTS.keys()))

@app.route('/api/channels/<playlist>')
def get_channels(playlist):
    try:
        if playlist not in PLAYLISTS:
            return jsonify({'error': 'Playlist not found'}), 404
            
        response = requests.get(PLAYLISTS[playlist])
        response.raise_for_status()
        channels = parse_m3u(response.text)
        return jsonify(channels)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
