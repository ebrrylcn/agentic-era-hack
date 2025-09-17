import yaml
from google.adk.agents import LlmAgent

from .tools import (
    hotels_search,
    hotel_details_and_prices,
    hotels_analyze
)



"""
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv()
"""


with open('app/sub_agents/hotels_agent/index.yml', 'r') as file:
    prompt_data = yaml.safe_load(file)

hotels_agent = LlmAgent(
    name="hotels_agent",
    model="gemini-2.5-flash",
    instruction=prompt_data['rootAgent']['systemPrompt'],
    tools=[
        hotels_search,
        hotel_details_and_prices,
        hotels_analyze
    ],
    description="Agent that searches for and evaluates hotels based on user input"
)
