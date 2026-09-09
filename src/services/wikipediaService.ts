export interface WikipediaEnrichment {
  producerCredits?: string[];
  thumbnailUrl?: string;
}

export async function fetchWikipediaAlbumInfo(title: string, artist: string): Promise<WikipediaEnrichment | null> {
  if (!title.trim()) return null;

  try {
    // 1. Search Wikipedia for album page
    const searchQueries = [
      `${title} (${artist} album)`,
      `${title} (${artist})`,
      `${title} (album)`,
      `${title} ${artist}`
    ];

    let pageTitle = '';
    let thumbnailUrl = '';

    for (const query of searchQueries) {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) continue;
      
      const searchData = await searchRes.json();
      const results = searchData.query?.search;
      if (results && results.length > 0) {
        // Pick best matching page
        const first = results[0];
        pageTitle = first.title;
        break;
      }
    }

    if (!pageTitle) return null;

    // 2. Fetch page summary extract via REST API
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryRes = await fetch(summaryUrl);
    
    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      thumbnailUrl = summaryData.thumbnail?.source || summaryData.originalimage?.source || '';
    }

    // 3. Fetch wikitext to extract producer credits.
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext|sections&format=json&origin=*`;
    const parseRes = await fetch(parseUrl);
    
    const producerCredits: string[] = [];

    if (parseRes.ok) {
      const parseData = await parseRes.json();
      const wikitext = parseData.parse?.wikitext?.['*'] || '';

      // Extract producers from infobox
      const producerMatch = wikitext.match(/^\|\s*producer\s*=\s*([^\n]+)/im);
      if (producerMatch && producerMatch[1]) {
        const rawProducers = producerMatch[1]
          .replace(/\{\{\s*(?:hlist|ubl|unbulleted list)\s*\|?/gi, '')
          .replace(/\}\}/g, '')
          .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // remove wiki links
          .replace(/\{\{[^}]+\}\}/g, '') // remove templates
          .split(/\||<br\s*\/?>|,|\n|&|\band\b/i)
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 2 && !/[{}]/.test(p));
        producerCredits.push(...rawProducers);
      }
    }

    return {
      producerCredits: producerCredits.length > 0 ? producerCredits : undefined,
      thumbnailUrl: thumbnailUrl || undefined,
    };
  } catch (error) {
    console.error('Error fetching Wikipedia album info:', error);
    return null;
  }
}
