import yaml
from env_utils import ensure_env_loaded

from google.adk.agents import LlmAgent, LoopAgent
from google.adk.planners import PlanReActPlanner

from .outputSchema import ItineraryResponse

from app.sub_agents.maps_agent.agent import (
    text_search_agent, place_details_agent, nearby_search_agent
)
from app.sub_agents.hotels_agent.agent import hotels_agent
from app.sub_agents.events_agent.agent import events_agent

import datetime

ensure_env_loaded()

with open('app/sub_agents/planner_agent/index.yml', 'r') as f:
    prompts = yaml.safe_load(f)

planner_summary_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='planner_summary_agent',
    instruction=prompts['summaryAgent']['systemPrompt'],
    output_schema=ItineraryResponse,
    output_key='summary',
    description="Agent that summarizes and refines the travel itinerary based on inputs from sub-agents"
)

summary_evaluator_agent = LlmAgent(
    model='gemini-2.5-pro',
    name='summary_evaluator_agent',
    instruction=prompts['summaryEvaluatorAgent']['systemPrompt'],
    output_schema=ItineraryResponse,
    output_key='corrected_itinerary',
    description="Agent that evaluates and corrects the travel itinerary summary"
)

planner_loop_agent = LoopAgent(
    name="planner_loop_agent",
    sub_agents=[planner_summary_agent, summary_evaluator_agent],
    max_iterations=3,
    description="Agent that iteratively refines the travel itinerary summary"
)
root_planner_agent = LlmAgent(
    model='gemini-2.5-pro',
    name='planner_agent',
    instruction=prompts['rootAgent']['systemPrompt'] + f"\nToday is {datetime.date.today().strftime('%d.%m.%Y')}.",
    planner=PlanReActPlanner(),
    sub_agents=[
        text_search_agent, place_details_agent, nearby_search_agent,
        hotels_agent, events_agent, planner_loop_agent
    ],
    description="Agent that plans a travel itinerary based on user input, utilizing maps, hotels, and events sub-agents"
)

planner_agent = root_planner_agent