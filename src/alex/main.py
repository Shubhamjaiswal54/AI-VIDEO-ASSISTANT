from dotenv import load_dotenv
from .util.audio_preprocessing import process_input
from .core.transcriber import transcribe_all
from .core.summarize import summarize, generate_title
from .core.extractor import extract_action_items, extract_key_decisions, extract_questions,extract_all_insights
from .core.rag_engine import build_rag_chain, ask_question
import time
load_dotenv()



def run_pipeline(source : str):
    
    chunks = process_input(source)
    transcript = transcribe_all(chunks)
    print(f"raw transcription (first 300 characters ) {transcript[:300]}")
    
    # time.sleep(5)
    # title = generate_title(transcript)

    # time.sleep(5)
    # summary = summarize(transcript)
    
    # time.sleep(5)
    # action_item = extract_action_items(transcript)
    
    # time.sleep(5)
    # decisions = extract_key_decisions(transcript)
    
    # time.sleep(5)
    # questions = extract_questions(transcript)
    
    insights = extract_all_insights(transcript)
    rag_chain = build_rag_chain(transcript)
    return {
        "title": insights["title"],
        "transcript": transcript,
        "summary": insights["summary"],
        "action_items": insights["action_items"],
        "key_decisions": insights["key_decisions"],
        "open_questions": insights["open_questions"],
        "rag_chain": rag_chain,
    }


if __name__ == "__main__":
    # CLI entry point
    source = input("Enter YouTube URL or local file path: ").strip()
    result = run_pipeline(source)
    print("\n" + "=" * 60)
    print(f"📌 Title: {result['title']}")
    print(f"\n📋 Summary:\n{result['summary']}")
    print(f"\n✅ Action Items:\n{result['action_items']}")
    print(f"\n🔑 Key Decisions:\n{result['key_decisions']}")
    print(f"\n❓ Open Questions:\n{result['open_questions']}")
    print("=" * 60)
    
    # Phase 2 — Chat with your meeting via RAG
    print("\n💬 Chat with your meeting (type 'exit' to quit)\n")
    rag_chain = result["rag_chain"]
    while True:
        question = input("You: ").strip()
        if question.lower() in ["exit", "quit", "q"]:
            print("👋 Goodbye!")
            break
        if not question:
            continue
        answer = ask_question(rag_chain, question)
        print(f"\n🤖 Assistant: {answer}\n")