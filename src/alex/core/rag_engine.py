import os

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from .vector_store import build_vector_store,  load_vector_store, get_retriever
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mistralai import ChatMistralAI
from langchain_groq import ChatGroq


# def get_llm():
#     model = ChatGoogleGenerativeAI(model="gemini3.5-flash")
#     return model



    

def get_llm(): 
    llm = ChatGroq(model="openai/gpt-oss-20b")
    return llm

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def get_prompt():
    return ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert meeting assistant.
Answer the user's question based ONLY on the meeting transcript context.

If the answer is not found in the context, say:
"I could not find this information in the meeting transcript."

Be concise and precise.

Context:
{context}"""
        ),
        ("human", "{question}"),
    ])


def build_chain(retriever):
    prompt = get_prompt()
    llm = get_llm()

    return (
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )


def build_rag_chain(transcript: str):
    vector_store = build_vector_store(transcript)
    retriever = get_retriever(vector_store, k=4)

    return build_chain(retriever)


def load_rag_chain():
    vector_store = load_vector_store()
    retriever = get_retriever(vector_store)
    return build_chain(retriever)


def ask_question(rag_chain, question: str) -> str:
    return rag_chain.invoke(question)