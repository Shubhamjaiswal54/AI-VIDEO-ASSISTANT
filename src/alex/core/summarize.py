from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnableLambda
load_dotenv()


def get_llm():
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash")
    return llm


def split_transcript(transcript:str) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 300,
        chunk_overlap = 200,
    )
    return splitter.split_text(transcript)


def summarize(transcribe):
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages(
        [
        ("system", "Summarize this portion of a meeting transcript concisely."),
        ("human", "{text}"),
    ]
    )
    model = prompt | llm |StrOutputParser()
    
    chunks = split_transcript(transcript=transcribe)
    chunks_sum = []
    for chunk in chunks:
        chunks_sum.append(model.invoke({"text":chunk}))
    
    combined = '\n\n'.join(chunks_sum)
    combined_prompt = ChatPromptTemplate.from_messages(
        [
        (
            "system",
            "You are an expert meeting summarizer. Combine these partial summaries "
            "into one final professional meeting summary in bullet points.",
        ),
        ("human", "{text}"),
    ]
    )
    
    chain = (
        {"text": RunnablePassthrough()}
        | combined_prompt
        | llm
        | StrOutputParser()
    )

    return chain.invoke(combined)

def generate_title(transcipt : str) -> str:
    llm = get_llm()

    

    title_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x:{"text":x}) | 
        ChatPromptTemplate.from_messages([
             (
                "system",
                "Based on the meeting transcript, generate a short professional meeting title "
                "(max 8 words). Only return the title, nothing else.",
            ),
            ("human", "{text}"),
        ])
        | llm
        |StrOutputParser()
    )

    return title_chain.invoke(transcipt[:2000])