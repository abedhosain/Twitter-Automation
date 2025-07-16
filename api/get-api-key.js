export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Automatic secret retrieval following the pattern: st.secrets.get("GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY","fallback"))
    const gemini_api_key = process.env.GEMINI_API_KEY || "AIzaSyDtv0oVGJF10ZYvbXZAWFhpCVeso4UQbOA";
    
    if (!gemini_api_key) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    res.status(200).json({ 
      apiKey: gemini_api_key,
      success: true 
    });
  } catch (error) {
    console.error('Error retrieving API key:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve API key',
      success: false 
    });
  }
}
