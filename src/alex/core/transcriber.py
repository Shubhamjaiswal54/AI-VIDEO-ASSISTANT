import whisper

model = None

def load_model():
    global model
    if(model == None):
        model = whisper.load_model("tiny")
    return model


def transcribe_chunk_whisper(chunk_path):
    model = load_model()
    result = model.transcribe(chunk_path , task ="transcribe")
    # print(result["text"])
    # return result["text"]
    return str(result["text"]).strip()



def transcribe_all(chunks) -> str:
    
    full_text = "";
    
    for i , chunk in enumerate(chunks):
        print(f"Transcribing chunk {i + 1}/{len(chunks)}...")        
        full_text += transcribe_chunk_whisper(chunk)

    return full_text.strip()