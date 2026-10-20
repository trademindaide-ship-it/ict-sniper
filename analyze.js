export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, prompt, images } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'Kein API-Key angegeben.' });
    }

    const content = [];
    if (images && Array.isArray(images)) {
      for (const imgData of images) {
        const matches = imgData.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: matches[1],
              data: matches[2]
            }
          });
        }
      }
    }

    if (typeof prompt === 'string') {
      content.push({ type: "text", text: prompt });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: content
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API Fehler' });
    }

    const textResult = data.content?.[0]?.text || '';
    return res.status(200).json({ text: textResult });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Serverfehler' });
  }
}
