import yt_dlp
from pydub import AudioSegment
import os

url = 'https://youtu.be/XN3xNJvWXsc?si=-4TY6y1VCAyq8xdo' 
folder = 'downloads'
os.makedirs(folder, exist_ok=True)

def download_audio_from_youtube(url):
    output_path = os.path.join(folder, '%(title)s.%(ext)s')
    
    """
    Downloads audio from a YouTube video and saves it to the specified output path.
    Args:
        url (str): The URL of the YouTube video.
    """
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            "preferredquality": "192",
        }]
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        base, _ = os.path.splitext(filename)
        return base + '.wav'
        
# download_audio_from_youtube(url)

def convert_audio_to_wav(input_file :str ):
  
    """
    Converts an audio file to single channel WAV format.
    Args:
        input_file (str): The path to the input audio file.
        output_file (str): The path to save the converted WAV file.
    """
    base, _ = os.path.splitext(input_file)
    output_path = f"{base}_converted.wav"
 
    if os.path.exists(output_path):
        return output_path
    
    audio = AudioSegment.from_file(input_file).set_channels(1).set_frame_rate(16000)
    audio.export(output_path , format = "wav")
    
    return output_path
# convert_audio_to_wav('downloads')


def chunk_audio(input_file: str , chunk_min : int = 10  ) -> list : 
    """
    Splits an audio file into smaller chunks of specified length.
    Args:
        input_file (str): The path to the input audio file.
        chunk_length_ms (int): The length of each chunk in milliseconds.
    """
    audio = AudioSegment.from_wav(input_file)
    chunks_ms = chunk_min *60 * 1000
    
    chunks = []
    
    for i , start in enumerate(range(0 , len(audio), chunks_ms)):
        chunk = audio[start : start+chunks_ms]
        chunk_path = f"{input_file}_chunk_{i}.wav"
        chunk.export(chunk_path , format="wav")
        chunks.append(chunk_path)
    
    return chunks
                
# chunk_audio('downloads', chunk_length_ms=30000)


def process_input(source : str) -> list :
    
    if(source.startswith("https://") or source.startswith("http://")):
        print("detected youtube url")
        raw_path = download_audio_from_youtube(source)
        wav_path = convert_audio_to_wav(raw_path)
    else: 
        print("detected local file")
        wav_path = convert_audio_to_wav(source)
    
    
    print("Chunking audio...")
    chunks = chunk_audio(wav_path)
    print(f"Audio ready — {len(chunks)} chunk(s) created.")
    return chunks


print(process_input(url))