// Petit client pour l'API Groq (compatible OpenAI), utilise par l'assistant code.
// Volontairement sans dependance : fetch natif (Node 18+) + AbortController pour le timeout.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 10000;

// Indique si une cle est configuree (sinon on ne tente pas d'appel reseau).
function isConfigured() {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
}

// Envoie une conversation a Groq et renvoie le texte de reponse.
// Leve une erreur en cas d'absence de cle, d'echec HTTP, de reseau ou de timeout :
// l'appelant (assistant) se charge du repli local.
async function chat(messages) {
  if (!isConfigured()) {
    throw new Error('GROQ_API_KEY absente');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        model: (process.env.GROQ_MODEL || DEFAULT_MODEL).trim(),
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? (data.choices[0].message.content || '').trim()
      : '';

    if (!reply) {
      throw new Error('Reponse Groq vide');
    }

    return reply;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { chat, isConfigured };
