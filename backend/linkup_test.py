from linkup import LinkupClient

client = LinkupClient(api_key="30cfefd6-decb-4278-acdf-20ed6b2a4ff7")

response = client.search(
    query="Give me D&D rules for a game of Dungeons and Dragons",
    depth="deep",
    output_type="sourcedAnswer"
)

print(response)