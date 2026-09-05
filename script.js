async function getDotaStats() {
  const id = document.getElementById('playerId').value.trim();
  const resultDiv = document.getElementById('result');

  if (!id) {
    resultDiv.innerHTML = '<p class="error">Введите ID!</p>';
    return;
  }

  if (!/^\d+$/.test(id)) {
    resultDiv.innerHTML = '<p class="error">Введите только Account ID из цифр.</p>';
    return;
  }

  resultDiv.innerHTML = '<p>Загрузка данных...</p>';

  try {
    const dotabuffUrl = `https://www.dotabuff.com/players/${id}`;
    const response = await fetch(dotabuffUrl);
    if (!response.ok) {
      throw new Error(`Dotabuff request failed: ${response.status}`);
    }

    const html = await response.text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    const pageText = document.body.innerText.replace(/\s+/g, ' ').trim();
    const title = document.title.replace(/\s+-\s+Overview.*$/i, '').trim();
    const dotabuffAvatar = document.querySelector('meta[property="og:image"]')?.content
      || document.querySelector('img.image-bigavatar')?.src;
    const steamId = (BigInt('76561197960265728') + BigInt(id)).toString();
    let avatar = null;

    try {
      const steamResponse = await fetch(`https://steamcommunity.com/profiles/${steamId}`);
      if (steamResponse.ok) {
        const steamHtml = await steamResponse.text();
        const steamDocument = new DOMParser().parseFromString(steamHtml, 'text/html');
        avatar = steamDocument.querySelector('meta[property="og:image"]')?.content;
      }
    } catch (steamError) {
      console.warn('Steam avatar request failed:', steamError);
    }

    avatar = avatar || dotabuffAvatar;
    const summary = pageText.match(/Last Match\s*(\d+-\d+)\s*Record\s*(\d+(?:\.\d+)?%)\s*Win Rate/i);
    const lastMatch = summary?.[1];
    const winRate = summary ? [summary[0], summary[2]] : null;
    const isPrivate = /This profile is private/i.test(pageText);

    resultDiv.innerHTML = `
      ${avatar ? `<img class="avatar" src="${avatar}" alt="Аватар ${title || id}">` : ''}
      <h3>${title || `Игрок ${id}`}</h3>
      ${lastMatch ? `<p><b>Последний матч:</b> ${lastMatch}</p>` : ''}
      ${winRate ? `<p><b>Винрейт:</b> ${winRate[1]}</p>` : ''}
      ${isPrivate ? '<p class="notice">Профиль приватный. Полная статистика доступна после входа через Steam на Dotabuff.</p>' : ''}
      <a class="profile-link" href="${dotabuffUrl}" target="_blank" rel="noopener">Открыть полный профиль Dotabuff</a>
    `;

  } catch (error) {
    resultDiv.innerHTML = '<p class="error">Ошибка при получении данных</p>';
    console.error(error);
  }
}
