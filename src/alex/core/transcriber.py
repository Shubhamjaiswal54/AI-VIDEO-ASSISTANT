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
    print(result["text"])
    return result["text"]




    