from google.adk.agents import LlmAgent, LoopAgent
from google.adk.tools import google_search
from google.adk.tools.tool_context import ToolContext
from dotenv import load_dotenv
import yaml

load_dotenv()

with open('app/tourgent/sub_agents/events_agent/index.yml', 'r') as file:
    prompt_data = yaml.safe_load(file)

def stop_search(tool_context: ToolContext):
    """
    A tool to stop the event search if sufficient relevant events have been found.
    """
    print(f"[Tool Call] stop_search triggered - sufficient events found")
    tool_context.actions.escalate = True
    return {}

event_search_agent = LlmAgent(
    name="EventSearchAgent",
    model="gemini-2.5-pro",
    instruction=prompt_data['searchAgent']["systemPrompt"],
    tools=[google_search],
    output_key="search_results",
    description="Searches for events based on user preferences and location"
)

event_evaluator_agent = LlmAgent(
    name="EventEvaluatorAgent", 
    model="gemini-2.5-pro",
    instruction=prompt_data['evaluatorAgent']["systemPrompt"],
    tools=[stop_search],
    output_key="evaluation",
    description="Evaluates search results to determine if enough relevant events have been found"
)

events_agent = LoopAgent(
    name="events_agent",
    sub_agents=[event_search_agent, event_evaluator_agent],
    max_iterations=3,
    description="Agent that searches for and evaluates events based on user input"
)
