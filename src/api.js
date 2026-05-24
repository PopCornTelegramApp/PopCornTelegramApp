const api = {
  _getInitData() {
    return TelegramApp.getInitData();
  },

  async _request(method, path, body) {
    const url = `${CONFIG.GATEWAY_URL}${path}`;
    const initData = this._getInitData();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `tma ${initData}`,
    };

    const options = { method, headers };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.message || errData.error) {
          errorMsg = errData.message || errData.error;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return response.json();
  },

  get(path) {
    return this._request('GET', path);
  },

  post(path, body) {
    return this._request('POST', path, body);
  },

  initUser() {
    return this.post('/api/users/init', {});
  },

  getMovies(page = 1, search = '', genre = '') {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', CONFIG.PAGINATION_LIMIT);
    if (search) params.set('search', search);
    if (genre) params.set('genre', genre);
    return this.get(`/api/movies?${params.toString()}`);
  },

  getMovie(id) {
    return this.get(`/api/movies/${id}`);
  },

  getMovieStream(id) {
    return this.get(`/api/movies/${id}/stream`);
  },

  getSeries(page = 1) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', CONFIG.PAGINATION_LIMIT);
    return this.get(`/api/series?${params.toString()}`);
  },

  getSeriesDetail(id) {
    return this.get(`/api/series/${id}`);
  },

  getEpisodeStream(id, season, episode) {
    return this.get(`/api/series/${id}/season/${season}/episode/${episode}`);
  },

  getUserProfile() {
    return this.get('/api/users/profile');
  },
};
