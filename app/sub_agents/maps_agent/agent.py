from google.adk.agents import Agent

from .tools import google_places_text_search, google_places_place_details, google_places_nearby_search

from .masks import place_details_field_masks, place_types, price_levels, ev_connector_types

import yaml


def format_system_prompt(prompt_template):
    return prompt_template.format(
        place_types=place_types,
        ev_connector_types=ev_connector_types,
        price_levels=price_levels,
        place_details_field_masks=place_details_field_masks
    )

with open('app/sub_agents/maps_agent/index.yml', 'r') as file:
    prompt_data = yaml.safe_load(file)

nearby_search_agent = Agent(
    model='gemini-2.5-pro',
    name='nearby_search_agent',
    instruction=format_system_prompt(prompt_data['nearbySearchAgent']["systemPrompt"]),
    tools=[ google_places_nearby_search ],
    description="Agent that performs nearby searches for places based on user criteria"
)

place_details_agent = Agent(
    model='gemini-2.5-pro',
    name='place_details_agent',
    instruction=format_system_prompt(prompt_data['placeDetailsAgent']["systemPrompt"]),
    tools=[ google_places_place_details ],
    description="Agent that retrieves detailed information about specific places"
)

text_search_agent = Agent(
    model='gemini-2.5-pro',
    name='text_search_agent',
    instruction=format_system_prompt(prompt_data['textSearchAgent']["systemPrompt"]),
    tools=[ google_places_text_search ],
    description="Agent that performs text-based searches for places based on user queries"
)

