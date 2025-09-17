import datetime
from zoneinfo import ZoneInfo
import yaml

from env_utils import ensure_env_loaded

from google.adk.agents import LlmAgent, LoopAgent, SequentialAgent
from google.adk.planners import PlanReActPlanner

from .outputSchema import ItineraryResponse
from .tools import validate_and_save_itinerary

from app.sub_agents.maps_agent.agent import (
    text_search_agent, place_details_agent, nearby_search_agent
)
from app.sub_agents.hotels_agent.agent import hotels_agent
from app.sub_agents.events_agent.agent import events_agent

ensure_env_loaded()

with open('app/sub_agents/planner_agent/index.yml', 'r', encoding='utf-8') as f:
    prompts = yaml.safe_load(f)

today_tr = datetime.datetime.now(ZoneInfo("Europe/Istanbul")).strftime("%d.%m.%Y")

from google.genai import types

TRANSFER_ONLY = types.GenerateContentConfig(
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY", 
            allowed_function_names=["transfer_to_agent"],
        )
    ),
)

researcher_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='researcher_agent',
    instruction=prompts['rootAgent']['systemPrompt'] + f"\nToday is {today_tr}.",
    planner=PlanReActPlanner(),  
    sub_agents=[
        text_search_agent, place_details_agent, nearby_search_agent,
        hotels_agent, events_agent
    ],
    generate_content_config=TRANSFER_ONLY,
    description="Plans a travel itinerary; delegates to maps/hotels/events agents."
)

planner_summary_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='planner_summary_agent',
    instruction=prompts['summaryAgent']['systemPrompt'],
    output_schema=ItineraryResponse,
    output_key='summary',
    description="Summarizes/refines the itinerary into a structured response.",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

summary_evaluator_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='summary_evaluator_agent',
    instruction=prompts['summaryEvaluatorAgent']['systemPrompt'],
    description="Evaluates and corrects the structured itinerary summary."
)

planner_loop_agent = LoopAgent(
    name="planner_loop_agent",
    sub_agents=[planner_summary_agent, summary_evaluator_agent],
    max_iterations=2,
    description="Iteratively refines the structured itinerary summary.",
)

save_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='save_agent',
    instruction=(
        "Validate the latest structured itinerary in context and then call "
        "`validate_and_save_itinerary` with the finalized object."
    ),
    tools=[validate_and_save_itinerary],
    description="Validates and persists the final itinerary using a function tool."
)

root_planner_agent = SequentialAgent(
    name="planner_agent",
    description="Top-level agent that coordinates planning, refinement, and saving.",
    sub_agents=[
        researcher_agent,     
        planner_loop_agent, 
        save_agent          
    ],
)
