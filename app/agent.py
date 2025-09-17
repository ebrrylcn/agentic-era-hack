import os
from env_utils import ensure_env_loaded
import yaml

from google.adk.agents import Agent
from .sub_agents.planner_agent.agent import planner_agent

ensure_env_loaded()

with open('apps/tourgent/index.yml', 'r') as f:
    prompt_data = yaml.safe_load(f)

root_agent = Agent(
    name="tourgent",
    model="gemini-2.5-flash",
    instruction=prompt_data['rootAgent']['systemPrompt'],
    sub_agents=[planner_agent],
    description="Top-level agent that orchestrates travel planning based on user input"
)
