const axios = require('axios');

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

const toHttps = (url = '') => (url ? url.replace(/^http:\/\//i, 'https://') : '');

exports.searchGoogleBooks = async (q) => {
    const params = { q, maxResults: 10 };
    if (process.env.GOOGLE_BOOKS_API_KEY) params.key = process.env.GOOGLE_BOOKS_API_KEY;

    const res = await axios.get(GOOGLE_BOOKS_URL, { params });
    const items = res.data.items || [];

    return items.map((item) => {
        const vi = item.volumeInfo || {};
        const id = item.id;
        const previewLink = vi.previewLink || '';
        const infoLink = vi.infoLink || '';
        const fallbackReader =
            previewLink ||
            (infoLink ? toHttps(infoLink) : '') ||
            `https://books.google.com/books?id=${encodeURIComponent(id)}&printsec=frontcover`;
        return {
            googleBookId: id,
            title: vi.title || 'Unknown',
            author: vi.authors?.[0] || 'Unknown',
            description: vi.description || '',
            coverImage: toHttps(vi.imageLinks?.thumbnail || ''),
            previewLink: fallbackReader,
            pageCount: Number(vi.pageCount || 0),
        };
    });
};

exports.getGoogleBookById = async (googleBookId) => {
    const params = {};
    if (process.env.GOOGLE_BOOKS_API_KEY) params.key = process.env.GOOGLE_BOOKS_API_KEY;

    const res = await axios.get(`${GOOGLE_BOOKS_URL}/${googleBookId}`, { params });

    const v = res.data?.volumeInfo || {};
    const previewLink = v.previewLink || '';
    const infoLink = v.infoLink || '';
    const fallbackReader =
        previewLink ||
        (infoLink ? toHttps(infoLink) : '') ||
        `https://books.google.com/books?id=${encodeURIComponent(googleBookId)}&printsec=frontcover`;

    return {
        googleBookId,
        title: v.title || 'Unknown',
        author: v.authors?.[0] || 'Unknown',
        description: v.description || '',
        coverImage: toHttps(v.imageLinks?.thumbnail || ''),
        previewLink: fallbackReader,
        pageCount: Number(v.pageCount || 0),
    };
};

exports.getBookById = async (googleBookId) => {
    const params = {};

    if (process.env.GOOGLE_BOOKS_API_KEY) {
        params.key = process.env.GOOGLE_BOOKS_API_KEY;
    }

    const response = await axios.get(
        `${GOOGLE_BOOKS_URL}/${googleBookId}`,
        { params }
    );

    const volume = response.data?.volumeInfo || {};
    const previewLink = volume.previewLink || '';
    const infoLink = volume.infoLink || '';
    const fallbackReader =
        previewLink ||
        (infoLink ? toHttps(infoLink) : '') ||
        `https://books.google.com/books?id=${encodeURIComponent(googleBookId)}&printsec=frontcover`;

    return {
        googleBookId,
        title: volume.title || 'Unknown',
        author: volume.authors
            ? volume.authors.join(', ')
            : 'Unknown',
        description: volume.description || '',
        coverImage: toHttps(volume.imageLinks?.thumbnail || ''),
        previewLink: fallbackReader,
        pageCount: Number(volume.pageCount || 0),
    };
};
