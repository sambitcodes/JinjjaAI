import os
import json
import time
import argparse
from typing import List, Dict, Any
from googleapiclient.discovery import build

# ----------------------------
# CONFIG
# ----------------------------

API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
MAX_RESULTS_PER_PAGE = 50  # YouTube max for list calls


# ----------------------------
# HELPERS
# ----------------------------

def get_api_key(env_key: str = "YOUTUBE_API_KEY") -> str:
    # Allow passing key directly or fallback to environment variables
    api_key = os.getenv(env_key)
    if not api_key:
        raise RuntimeError(f"Missing {env_key} environment variable.")
    return api_key


def build_youtube_client(api_key: str):
    return build(API_SERVICE_NAME, API_VERSION, developerKey=api_key)


def extract_video_fields(item: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize video metadata from videos.list result item."""
    snippet = item.get("snippet", {})
    content_details = item.get("contentDetails", {})
    statistics = item.get("statistics", {})

    thumbnails = snippet.get("thumbnails", {})
    def thumb_url(size: str):
        return thumbnails.get(size, {}).get("url")

    # Parse ISO 8601 duration to human readable format (e.g. PT19M32S -> "19:32" or "1:03:22")
    raw_duration = content_details.get("duration", "PT0S")
    duration_str = format_iso_duration(raw_duration)

    return {
        "yt_video_id": item.get("id"),
        "channel_title": snippet.get("channelTitle"),
        "channel_id": snippet.get("channelId"),
        "title": snippet.get("title"),
        "description": snippet.get("description"),
        "published_at": snippet.get("publishedAt"),
        "thumbnail_default": thumb_url("default") or thumb_url("medium") or "",
        "thumbnail_medium": thumb_url("medium") or "",
        "thumbnail_high": thumb_url("high") or "",
        "duration_iso8601": raw_duration,
        "duration": duration_str,
        "view_count": int(statistics.get("viewCount", 0)) if "viewCount" in statistics else 0,
        "like_count": int(statistics.get("likeCount", 0)) if "likeCount" in statistics else 0,
        "comment_count": int(statistics.get("commentCount", 0)) if "commentCount" in statistics else 0,
        "tags": snippet.get("tags", []),
    }


def format_iso_duration(iso_duration: str) -> str:
    """Converts ISO 8601 duration (e.g. PT1H23M45S) into human readable '1:23:45' or '05:22'."""
    import re
    # Regular expression to extract hours, minutes, and seconds
    pattern = re.compile(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?')
    match = pattern.match(iso_duration)
    if not match:
        return "00:00"
    
    hours = int(match.group(1)) if match.group(1) else 0
    minutes = int(match.group(2)) if match.group(2) else 0
    seconds = int(match.group(3)) if match.group(3) else 0

    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes:02d}:{seconds:02d}"


def chunked(iterable, size):
    """Yield lists of length <= size from iterable."""
    buf = []
    for x in iterable:
        buf.append(x)
        if len(buf) == size:
            yield buf
            buf = []
    if buf:
        yield buf


# ----------------------------
# API CALLS
# ----------------------------

def fetch_playlist_videos(youtube, playlist_id: str) -> List[Dict[str, Any]]:
    """
    Returns a list of dicts with videoId and playlistItem metadata.
    """
    playlist_items = []
    page_token = None

    while True:
        try:
            req = youtube.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=playlist_id,
                maxResults=MAX_RESULTS_PER_PAGE,
                pageToken=page_token
            )
            resp = req.execute()
            items = resp.get("items", [])
            for it in items:
                snippet = it.get("snippet", {})
                content_details = it.get("contentDetails", {})
                video_id = content_details.get("videoId")
                if not video_id:
                    continue
                playlist_items.append({
                    "yt_video_id": video_id,
                    "playlist_position": snippet.get("position"),
                    "playlist_published_at": snippet.get("publishedAt")
                })
            page_token = resp.get("nextPageToken")
            if not page_token:
                break
        except Exception as e:
            print(f"[ERROR] Failed to fetch playlist items for {playlist_id}: {e}")
            break

    return playlist_items


def fetch_videos_details(youtube, video_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Batch-fetch full metadata for many videos using videos.list.
    Returns dict: video_id -> normalized_fields.
    """
    result = {}
    for batch in chunked(video_ids, 50):  # API max ids per call
        try:
            req = youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=",".join(batch)
            )
            resp = req.execute()
            for item in resp.get("items", []):
                video_id = item.get("id")
                result[video_id] = extract_video_fields(item)
        except Exception as e:
            print(f"[ERROR] Failed to batch fetch video details for batch {batch[:3]}...: {e}")
        # small delay to be nice to API
        time.sleep(0.1)
    return result


def fetch_single_video(youtube, video_id: str) -> Dict[str, Any]:
    details = fetch_videos_details(youtube, [video_id])
    return details.get(video_id)


# ----------------------------
# MAIN PROCESSING
# ----------------------------

def process_seed_entry(youtube, seed: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Given one seed record from your seed JSON (playlist/video),
    return a list of fully-enriched video objects with your tags merged in.
    """
    seed_type = seed.get("type")
    seed_id = seed.get("id")

    cefr_range = seed.get("cefr_range")
    topics = seed.get("topics", [])
    skills = seed.get("skills", [])

    results = []

    if seed_type == "playlist":
        playlist_url = seed.get("resource_url")
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(playlist_url).query)
        playlist_id = qs.get("list", [None])[0]
        if not playlist_id:
            print(f"[WARN] Could not find playlist id in url for seed {seed_id}")
            return []

        print(f"[INFO] Fetching playlist {playlist_id}...")
        playlist_items = fetch_playlist_videos(youtube, playlist_id)
        video_ids = [pi["yt_video_id"] for pi in playlist_items]
        details_map = fetch_videos_details(youtube, video_ids)

        for pi in playlist_items:
            vid = pi["yt_video_id"]
            detail = details_map.get(vid)
            if not detail:
                continue
            combined = {
                **detail,
                "yt_playlist_id": playlist_id,
                "resource_url": f"https://www.youtube.com/watch?v={vid}",
                "cefr_range": cefr_range,
                "topics": topics,
                "skills": skills,
                "source_seed_id": seed_id
            }
            results.append(combined)

    elif seed_type == "video":
        from urllib.parse import urlparse, parse_qs
        video_url = seed.get("resource_url")
        qs = parse_qs(urlparse(video_url).query)
        video_id = qs.get("v", [None])[0]
        if not video_id:
            if "youtu.be/" in video_url:
                video_id = video_url.rsplit("/", 1)[-1].split("?")[0]
        if not video_id:
            print(f"[WARN] Could not parse video id for seed {seed_id}")
            return []

        print(f"[INFO] Fetching single video {video_id}...")
        detail = fetch_single_video(youtube, video_id)
        if detail:
            combined = {
                **detail,
                "yt_playlist_id": None,
                "resource_url": f"https://www.youtube.com/watch?v={video_id}",
                "cefr_range": cefr_range,
                "topics": topics,
                "skills": skills,
                "source_seed_id": seed_id
            }
            results.append(combined)

    else:
        print(f"[WARN] Unknown seed type {seed_type} for {seed_id}")

    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seed_json", help="Path to seed JSON file (your curated list)")
    parser.add_argument("output_json", help="Path to output JSON file with expanded catalog")
    args = parser.parse_args()

    api_key = get_api_key()
    youtube = build_youtube_client(api_key)

    with open(args.seed_json, "r", encoding="utf-8") as f:
        seeds = json.load(f)

    all_videos = []
    for seed in seeds:
        vids = process_seed_entry(youtube, seed)
        all_videos.extend(vids)

    print(f"[INFO] Total videos collected: {len(all_videos)}")

    # Deduplicate by video id
    dedup = {}
    for v in all_videos:
        vid = v["yt_video_id"]
        if vid not in dedup:
            dedup[vid] = v
    all_videos = list(dedup.values())

    print(f"[INFO] Deduplicated total videos: {len(all_videos)}")

    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(all_videos, f, ensure_ascii=False, indent=2)

    print(f"[INFO] Written to {args.output_json}")


if __name__ == "__main__":
    main()