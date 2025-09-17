import os
from env_utils import ensure_env_loaded
import yaml

from google.adk.agents import Agent
from app.sub_agents.planner_agent.agent import root_planner_agent

ensure_env_loaded()

with open('app/index.yml', 'r') as f:
    prompt_data = yaml.safe_load(f)

root_agent = Agent(
    name="tourgent",
    model="gemini-2.5-flash",
    instruction=prompt_data['rootAgent']['systemPrompt'],
    sub_agents=[root_planner_agent],
    description="Top-level agent that orchestrates travel planning based on user input"
)
