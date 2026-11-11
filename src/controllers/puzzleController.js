export const getPuzzle = async (req, res, next) => {
  try {
    const url = 'https://marcconrad.com/uob/fish/api.php?out=json&base64=yes'

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`)
    }

    const data = await response.json()
    const rawQuestion = (data.question || '').trim()

    // Ensure valid base64 data URL
    const formattedQuestion =
      rawQuestion.startsWith('http') || rawQuestion.startsWith('/')
        ? rawQuestion
        : rawQuestion.startsWith('data:')
          ? rawQuestion
          : `data:image/png;base64,${rawQuestion}`

    const fishCount =
      typeof data.fish === 'number'
        ? data.fish
        : parseInt(data.fish, 10) || 0

    const chestCount =
      typeof data.chest === 'number'
        ? data.chest
        : parseInt(data.chest, 10) || 1

    res.json({
      success: true,
      question: formattedQuestion,
      fish: fishCount,
      chest: chestCount,
    })
  } catch (error) {
    // Graceful fallback for offline mode or network timeouts
    console.warn('Failed to reach marcconrad.com, returning fallback puzzle:', error.message)
    res.json({
      success: true,
      fallback: true,
      question: '/game-assets/fish-puzzle-sample.png',
      fish: 8,
      chest: 5,
    })
  }
}
