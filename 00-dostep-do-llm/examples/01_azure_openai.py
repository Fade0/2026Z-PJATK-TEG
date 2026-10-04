"""Azure OpenAI (Azure for Students, 100 USD na 12 miesięcy, bez karty).

W Azure AI Foundry tworzysz deployment dla KAŻDEGO modelu; w kodzie `model=` to NAZWA DEPLOYMENTU.
.env (endpoint z *Keys and Endpoint* zasobu, nie adres projektu `…/api/projects/…`):
  AZURE_OPENAI_ENDPOINT=https://<twoj-zasob>.openai.azure.com/
  AZURE_OPENAI_API_KEY=...
"""
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()
client = AzureOpenAI(api_version="2024-10-21")  # endpoint i klucz czyta z .env

response = client.chat.completions.create(
    model="gpt-4.1-mini",  # nazwa Twojego deploymentu
    messages=[{"role": "user", "content": "Czym jest embedding? Jedno zdanie."}],
)
print(response.choices[0].message.content)
