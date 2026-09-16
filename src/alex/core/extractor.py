from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_mistralai import ChatMistralAI
from pydantic import BaseModel, Field
from typing import List
from langchain_groq import ChatGroq
    

def get_llm(): 
    llm = ChatGroq(model="openai/gpt-oss-20b")
    return llm

def build_chain(system_prompt):
    model = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{text}"),
    ])
    chain = prompt | model | StrOutputParser()
    return chain

def extract_action_items(transcript:str)->str:
    chain = build_chain(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all action items. For each provide:\n"
        "- Task description\n- Owner (who is responsible)\n- Deadline\n\n"
        "Format as a numbered list. If none found say 'No action items found.'"
    )
    return chain.invoke({"text" :transcript})
    
def extract_key_decisions(transcript: str) -> str:
    chain = build_chain(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all key decisions made. Format as a numbered list. "
        "If none found say 'No key decisions found.'"
    )
    return chain.invoke({"text" :transcript})

def extract_questions(transcript: str) -> str:
    chain = build_chain(
        "From the meeting transcript, extract all unresolved questions "
        "or topics needing follow-up. Format as a numbered list. "
        "If none found say 'No open questions found.'"
    )
    return chain.invoke({"text" :transcript})


class MeetingInsights(BaseModel):
    title: str = Field(description="A short, catchy title for the transcript")
    summary: str = Field(description="A 2-paragraph summary of the transcript")
    action_items: List[str] = Field(description="List of action items, including owner and deadline. If none, return empty list.")
    key_decisions: List[str] = Field(description="List of key decisions made. If none, return empty list.")
    open_questions: List[str] = Field(description="List of unresolved questions or topics needing follow-up. If none, return empty list.")

def extract_all_insights(transcript: str) -> dict:
    model = get_llm()
    
    # 2. Set up the parser based on your Pydantic model
    parser = JsonOutputParser(pydantic_object=MeetingInsights)

    # 3. Create the prompt, injecting the format instructions automatically
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert meeting analyst. Extract the requested information from the transcript.\n\n{format_instructions}"),
        ("human", "{text}")
    ])

    # 4. Build the chain (Prompt -> LLM -> JSON Parser)
    chain = prompt | model | parser

    # 5. Invoke the chain
    return chain.invoke({
        "text": transcript,
        "format_instructions": parser.get_format_instructions()
    })