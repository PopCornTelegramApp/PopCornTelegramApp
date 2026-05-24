const App = {
  _currentPage: 'home',
  _moviePage: 1,
  _searchPage: 1,
  _seriesPage: 1,
  _currentGenre: '',
  _searchQuery: '',
  _searchTab: 'movies',
  _currentMovieId: null,
  _currentSeriesId: null,
  _genres: [],
  _allGenres: [],

  async init() {
    TelegramApp.init();
    TelegramApp.applyTheme();
    this._applyTelegramTheme();
    try {
      await api.initUser();
    } catch (e) {
      console.warn('User init failed:', e);
    }
    this._bindEvents();
    this._genres = [
      'أكشن', 'كوميديا', 'دراما', 'رعب', 'خيال علمي',
      'رومانسية', 'إثارة', 'غموض', 'مغامرة', 'أنمي',
      'وثائقي', 'تاريخي', 'حرب', 'عائلي', 'جريمة'
    ];
    this._allGenres = this._genres;
    await this.renderHome();
  },

  _applyTelegramTheme() {
    const tp = TelegramApp.getThemeParams();
    const root = document.documentElement;
    if (tp.bg_color) root.style.setProperty('--tg-theme-bg-color', tp.bg_color);
    if (tp.text_color) root.style.setProperty('--tg-theme-text-color', tp.text_color);
    if (tp.button_color) root.style.setProperty('--tg-theme-button-color', tp.button_color);
    if (tp.hint_color) root.style.setProperty('--tg-theme-hint-color', tp.hint_color);
    if (tp.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', tp.secondary_bg_color);
    const bg = tp.bg_color || (TelegramApp.isDark() ? '#0f0f1a' : '#ffffff');
    const text = tp.text_color || (TelegramApp.isDark() ? '#ffffff' : '#1a1a2e');
    const btn = tp.button_color || '#e94560';
    const hint = tp.hint_color || '#888888';
    const secBg = tp.secondary_bg_color || (TelegramApp.isDark() ? '#1a1a2e' : '#f5f5fa');
    root.style.setProperty('--bg-color', bg);
    root.style.setProperty('--text-color', text);
    root.style.setProperty('--button-color', btn);
    root.style.setProperty('--hint-color', hint);
    root.style.setProperty('--secondary-bg-color', secBg);
  },

  _bindEvents() {
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.nav-btn');
      if (navBtn) {
        const page = navBtn.dataset.page;
        this._navigate(page);
        return;
      }
      const movieCard = e.target.closest('.movie-card');
      if (movieCard) {
        const id = movieCard.dataset.id;
        const type = movieCard.dataset.type;
        if (type === 'series') {
          this.renderSeriesDetail(id);
        } else {
          this.renderMovieDetail(id);
        }
        return;
      }
      const backBtn = e.target.closest('.btn-back');
      if (backBtn) {
        this._navigate('home');
        return;
      }
      const genreChip = e.target.closest('.genre-chip');
      if (genreChip) {
        const genre = genreChip.dataset.genre;
        this._filterByGenre(genre);
        return;
      }
      const tabBtn = e.target.closest('.tab-btn');
      if (tabBtn && tabBtn.closest('#page-search')) {
        this._switchSearchTab(tabBtn.dataset.tab);
        return;
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'search-input') {
        this._onSearchInput(e.target.value);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'season-select') {
        this._loadEpisodes(e.target.value);
      }
      if (e.target.id === 'episode-select') {
        this._onEpisodeSelect(e.target.value);
      }
    });

    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => this._navigate('home'));

    const loadMoreMovies = document.getElementById('btn-load-movies');
    if (loadMoreMovies) loadMoreMovies.addEventListener('click', () => this._loadMoreMovies());

    const loadMoreSearch = document.getElementById('btn-load-search');
    if (loadMoreSearch) loadMoreSearch.addEventListener('click', () => this._loadMoreSearch());

    const searchClear = document.getElementById('search-clear');
    if (searchClear) searchClear.addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      searchClear.classList.remove('visible');
      this._searchQuery = '';
      this._searchPage = 1;
      this._performSearch();
    });
  },

  _navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
      targetPage.scrollTop = 0;
    }
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');
    this._currentPage = page;
  },

  _showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
  },

  renderLoading() {
    this._showPage('page-loading');
  },

  renderError(msg) {
    const el = document.getElementById('error-message');
    if (el) el.textContent = msg || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
    this._showPage('page-error');
  },

  async renderHome() {
    this.renderLoading();
    try {
      const data = await api.getMovies(1, '', this._currentGenre);
      this._moviePage = 1;
      this._renderGenreFilters('genre-filter-home');
      this._renderMovies(data.movies || data.data || data.results || []);
      this._navigate('home');
      document.getElementById('page-home').scrollTop = 0;
    } catch (e) {
      this.renderError(e.message);
    }
  },

  _renderGenreFilters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const activeGenre = this._currentGenre;
    let html = '<button class="genre-chip' + (activeGenre === '' ? ' active' : '') + '" data-genre="">الكل</button>';
    this._genres.forEach(g => {
      html += '<button class="genre-chip' + (activeGenre === g ? ' active' : '') + '" data-genre="' + g + '">' + g + '</button>';
    });
    container.innerHTML = html;
  },

  _renderMovies(movies) {
    const grid = document.getElementById('movies-grid');
    if (!grid) return;
    if (!movies || movies.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🎬</div><p>لا توجد أفلام متاحة حالياً</p></div>';
      document.getElementById('load-more-home').style.display = 'none';
      return;
    }
    grid.innerHTML = movies.map(m => this._movieCardHTML(m)).join('');
    document.getElementById('load-more-home').style.display = movies.length < CONFIG.PAGINATION_LIMIT ? 'none' : 'flex';
  },

  _movieCardHTML(item) {
    const title = item.title || item.name || 'بدون عنوان';
    const year = item.year || item.releaseYear || '';
    const poster = item.poster || item.posterUrl || '';
    const type = item.type || 'movie';
    const id = item.id || item._id;
    const posterHTML = poster
      ? '<img class="movie-poster" src="' + poster + '" alt="' + title + '" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\\'movie-poster-placeholder\\\'>🎬</div>\'">'
      : '<div class="movie-poster-placeholder">🎬</div>';
    return '<div class="movie-card" data-id="' + id + '" data-type="' + type + '">'
      + posterHTML
      + '<div class="movie-info">'
      + '<div class="movie-title">' + title + '</div>'
      + (year ? '<div class="movie-year">' + year + '</div>' : '')
      + (type === 'series' ? '<span class="movie-type">مسلسل</span>' : '')
      + '</div></div>';
  },

  async _loadMoreMovies() {
    const btn = document.getElementById('btn-load-movies');
    if (btn) btn.textContent = 'جاري التحميل...';
    try {
      this._moviePage++;
      const data = await api.getMovies(this._moviePage, '', this._currentGenre);
      const movies = data.movies || data.data || data.results || [];
      const grid = document.getElementById('movies-grid');
      if (grid) grid.innerHTML += movies.map(m => this._movieCardHTML(m)).join('');
      if (movies.length < CONFIG.PAGINATION_LIMIT) {
        document.getElementById('load-more-home').style.display = 'none';
      }
    } catch (e) {
      this._moviePage--;
      TelegramApp.showAlert('فشل تحميل المزيد: ' + e.message);
    }
    if (btn) btn.textContent = 'تحميل المزيد';
  },

  async renderMovieDetail(id) {
    this.renderLoading();
    this._currentMovieId = id;
    document.getElementById('page-movie-detail').scrollTop = 0;
    try {
      const movie = await api.getMovie(id);
      const data = movie.movie || movie.data || movie;
      const title = data.title || 'بدون عنوان';
      const year = data.year || data.releaseYear || '';
      const rating = data.rating || data.imdbRating || '';
      const overview = data.overview || data.description || data.plot || 'لا توجد معلومات متاحة';
      const genres = data.genres || [];
      const backdrop = data.backdrop || data.backdropUrl || data.poster || '';
      const backdropHTML = backdrop
        ? '<img class="detail-backdrop" src="' + backdrop + '" alt="' + title + '" onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\\'detail-backdrop-placeholder\\\'>🎬</div>\'">'
        : '<div class="detail-backdrop-placeholder">🎬</div>';

      let html = '<div class="detail-body">';
      html += backdropHTML;
      html += '<h1 class="detail-title">' + title + '</h1>';
      html += '<div class="detail-meta">';
      if (year) html += '<span>' + year + '</span>';
      if (rating) html += '<span class="rating">⭐ ' + rating + '</span>';
      html += '</div>';
      if (genres.length) {
        html += '<div class="detail-genres">' + genres.map(g => '<span class="detail-genre">' + g + '</span>').join('') + '</div>';
      }
      html += '<p class="detail-overview">' + overview + '</p>';
      html += '<button class="btn-watch" id="btn-watch-movie">▶ مشاهدة الآن</button>';
      html += '</div>';

      document.getElementById('detail-content').innerHTML = html;
      this._showPage('page-movie-detail');

      document.getElementById('btn-watch-movie').addEventListener('click', async () => {
        try {
          const stream = await api.getMovieStream(id);
          const streamUrl = stream.url || stream.streamUrl || stream.data?.url || '';
          if (streamUrl) {
            this.renderPlayer(streamUrl, title);
          } else {
            TelegramApp.showAlert('عذراً، رابط المشاهدة غير متاح حالياً');
          }
        } catch (e) {
          TelegramApp.showAlert('فشل تحميل الفيديو: ' + e.message);
        }
      });
    } catch (e) {
      this.renderError(e.message);
    }
  },

  async renderSeriesDetail(id) {
    this.renderLoading();
    this._currentSeriesId = id;
    document.getElementById('page-movie-detail').scrollTop = 0;
    try {
      const series = await api.getSeriesDetail(id);
      const data = series.series || series.data || series;
      const title = data.title || data.name || 'بدون عنوان';
      const year = data.year || data.releaseYear || '';
      const rating = data.rating || data.imdbRating || '';
      const overview = data.overview || data.description || data.plot || 'لا توجد معلومات متاحة';
      const genres = data.genres || [];
      const backdrop = data.backdrop || data.backdropUrl || data.poster || '';
      const seasons = data.seasons || [];
      const backdropHTML = backdrop
        ? '<img class="detail-backdrop" src="' + backdrop + '" alt="' + title + '" onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\\'detail-backdrop-placeholder\\\'>🎬</div>\'">'
        : '<div class="detail-backdrop-placeholder">🎬</div>';

      let html = '<div class="detail-body">';
      html += backdropHTML;
      html += '<h1 class="detail-title">' + title + '</h1>';
      html += '<div class="detail-meta">';
      if (year) html += '<span>' + year + '</span>';
      if (rating) html += '<span class="rating">⭐ ' + rating + '</span>';
      html += '<span class="movie-type">مسلسل</span>';
      html += '</div>';
      if (genres.length) {
        html += '<div class="detail-genres">' + genres.map(g => '<span class="detail-genre">' + g + '</span>').join('') + '</div>';
      }
      html += '<p class="detail-overview">' + overview + '</p>';

      if (seasons.length) {
        html += '<div class="episode-selector">';
        html += '<h3>اختر الموسم والحلقة</h3>';
        html += '<select class="season-select" id="season-select">';
        html += '<option value="">اختر الموسم</option>';
        seasons.forEach((s, i) => {
          const seasonNum = s.season_number || s.number || (i + 1);
          html += '<option value="' + seasonNum + '">الموسم ' + seasonNum + '</option>';
        });
        html += '</select>';
        html += '<select class="episode-select" id="episode-select" disabled>';
        html += '<option value="">اختر الحلقة أولاً</option>';
        html += '</select>';
        html += '</div>';
      } else {
        html += '<button class="btn-watch" id="btn-watch-series">▶ مشاهدة</button>';
      }

      html += '</div>';
      document.getElementById('detail-content').innerHTML = html;
      this._showPage('page-movie-detail');

      const watchBtn = document.getElementById('btn-watch-series');
      if (watchBtn) {
        watchBtn.addEventListener('click', async () => {
          try {
            const stream = await api.getEpisodeStream(id, 1, 1);
            const streamUrl = stream.url || stream.streamUrl || '';
            if (streamUrl) this.renderPlayer(streamUrl, title);
            else TelegramApp.showAlert('رابط المشاهدة غير متاح');
          } catch (e) {
            TelegramApp.showAlert('فشل: ' + e.message);
          }
        });
      }
    } catch (e) {
      this.renderError(e.message);
    }
  },

  async _loadEpisodes(seasonNum) {
    if (!seasonNum) return;
    const select = document.getElementById('episode-select');
    if (!select) return;
    select.disabled = true;
    select.innerHTML = '<option value="">جاري التحميل...</option>';
    try {
      const series = await api.getSeriesDetail(this._currentSeriesId);
      const data = series.series || series.data || series;
      const seasons = data.seasons || [];
      const season = seasons.find(s => {
        const sn = s.season_number || s.number;
        return String(sn) === seasonNum;
      });
      const episodes = season ? (season.episodes || []) : [];
      select.disabled = false;
      select.innerHTML = '<option value="">اختر الحلقة</option>';
      if (episodes.length) {
        episodes.forEach(ep => {
          const epNum = ep.episode_number || ep.number || '';
          const epTitle = ep.title || 'حلقة ' + epNum;
          select.innerHTML += '<option value="' + epNum + '">' + epTitle + '</option>';
        });
      } else {
        for (let i = 1; i <= 12; i++) {
          select.innerHTML += '<option value="' + i + '">حلقة ' + i + '</option>';
        }
      }
    } catch (e) {
      select.disabled = false;
      select.innerHTML = '<option value="">فشل التحميل</option>';
    }
  },

  async _onEpisodeSelect(episodeNum) {
    if (!episodeNum || !this._currentSeriesId) return;
    const seasonNum = document.getElementById('season-select').value;
    if (!seasonNum) return;
    try {
      const series = await api.getSeriesDetail(this._currentSeriesId);
      const data = series.series || series.data || series;
      const title = data.title || data.name || 'مسلسل';
      const stream = await api.getEpisodeStream(this._currentSeriesId, seasonNum, episodeNum);
      const streamUrl = stream.url || stream.streamUrl || '';
      if (streamUrl) this.renderPlayer(streamUrl, title + ' - S' + seasonNum + 'E' + episodeNum);
      else TelegramApp.showAlert('رابط المشاهدة غير متاح');
    } catch (e) {
      TelegramApp.showAlert('فشل: ' + e.message);
    }
  },

  renderPlayer(url, title) {
    const titleEl = document.getElementById('player-title');
    if (titleEl) titleEl.textContent = title || 'المشغل';
    const video = document.getElementById('video-player');
    if (video) {
      video.src = url;
      video.load();
    }
    this._showPage('page-player');
  },

  renderSearch() {
    this._navigate('search');
    this._renderGenreFilters('genre-filter-search');
    document.getElementById('search-input').focus();
    this._searchPage = 1;
    this._performSearch();
  },

  _switchSearchTab(tab) {
    this._searchTab = tab;
    document.querySelectorAll('.search-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector('.search-tabs .tab-btn[data-tab="' + tab + '"]');
    if (activeBtn) activeBtn.classList.add('active');
    this._searchPage = 1;
    this._performSearch();
  },

  _onSearchInput(value) {
    this._searchQuery = value.trim();
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) {
      clearBtn.classList.toggle('visible', this._searchQuery.length > 0);
    }
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this._searchPage = 1;
      this._performSearch();
    }, 400);
  },

  async _performSearch() {
    const grid = document.getElementById('results-grid');
    if (!grid) return;
    const query = this._searchQuery;
    const genre = this._currentGenre;
    try {
      if (this._searchTab === 'movies') {
        const data = await api.getMovies(this._searchPage, query, genre);
        const movies = data.movies || data.data || data.results || [];
        grid.innerHTML = movies.length
          ? movies.map(m => this._movieCardHTML(m)).join('')
          : '<div class="empty-state"><div class="empty-icon">🔍</div><p>لا توجد نتائج</p></div>';
        document.getElementById('load-more-search').style.display = movies.length < CONFIG.PAGINATION_LIMIT ? 'none' : 'flex';
      } else {
        const data = await api.getSeries(this._searchPage);
        const series = data.series || data.data || data.results || [];
        const filtered = query
          ? series.filter(s => (s.title || s.name || '').toLowerCase().includes(query.toLowerCase()))
          : series;
        grid.innerHTML = filtered.length
          ? filtered.map(m => this._movieCardHTML({ ...m, type: 'series' })).join('')
          : '<div class="empty-state"><div class="empty-icon">🔍</div><p>لا توجد نتائج</p></div>';
        document.getElementById('load-more-search').style.display = filtered.length < CONFIG.PAGINATION_LIMIT ? 'none' : 'flex';
      }
    } catch (e) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>فشل البحث: ' + e.message + '</p></div>';
    }
  },

  async _loadMoreSearch() {
    const btn = document.getElementById('btn-load-search');
    if (btn) btn.textContent = 'جاري التحميل...';
    try {
      this._searchPage++;
      const grid = document.getElementById('results-grid');
      const query = this._searchQuery;
      const genre = this._currentGenre;
      if (this._searchTab === 'movies') {
        const data = await api.getMovies(this._searchPage, query, genre);
        const movies = data.movies || data.data || data.results || [];
        if (grid) grid.innerHTML += movies.map(m => this._movieCardHTML(m)).join('');
        if (movies.length < CONFIG.PAGINATION_LIMIT) {
          document.getElementById('load-more-search').style.display = 'none';
        }
      } else {
        const data = await api.getSeries(this._searchPage);
        const series = data.series || data.data || data.results || [];
        const filtered = query
          ? series.filter(s => (s.title || s.name || '').toLowerCase().includes(query.toLowerCase()))
          : series;
        if (grid) grid.innerHTML += filtered.map(m => this._movieCardHTML({ ...m, type: 'series' })).join('');
        if (filtered.length < CONFIG.PAGINATION_LIMIT) {
          document.getElementById('load-more-search').style.display = 'none';
        }
      }
    } catch (e) {
      this._searchPage--;
      TelegramApp.showAlert('فشل تحميل المزيد: ' + e.message);
    }
    if (btn) btn.textContent = 'تحميل المزيد';
  },

  _filterByGenre(genre) {
    this._currentGenre = genre;
    document.querySelectorAll('.genre-chip').forEach(c => c.classList.toggle('active', c.dataset.genre === genre));
    if (this._currentPage === 'home') {
      this._moviePage = 1;
      this._loadMoviesByGenre();
    } else if (this._currentPage === 'search') {
      this._searchPage = 1;
      this._performSearch();
    }
  },

  async _loadMoviesByGenre() {
    const grid = document.getElementById('movies-grid');
    if (!grid) return;
    this._renderGenreFilters('genre-filter-home');
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>جاري التحميل...</p></div>';
    try {
      const data = await api.getMovies(1, '', this._currentGenre);
      this._moviePage = 1;
      this._renderMovies(data.movies || data.data || data.results || []);
    } catch (e) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>فشل التحميل: ' + e.message + '</p></div>';
    }
  },

  async renderProfile() {
    this._navigate('profile');
    const avatar = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const usernameEl = document.getElementById('profile-username');
    const statsEl = document.getElementById('profile-stats');

    const user = TelegramApp.getUser();
    const firstName = user.first_name || 'مستخدم';
    const lastName = user.last_name || '';
    const username = user.username || '';
    nameEl.textContent = firstName + (lastName ? ' ' + lastName : '');
    usernameEl.textContent = username ? '@' + username : '';

    if (user.photo_url || user.photoUrl) {
      avatar.innerHTML = '<img src="' + (user.photo_url || user.photoUrl) + '" alt="avatar">';
    } else {
      const initial = firstName.charAt(0).toUpperCase();
      avatar.textContent = initial || '👤';
    }

    try {
      const profile = await api.getUserProfile();
      const data = profile.user || profile.data || profile;
      statsEl.innerHTML = '<div class="stat-item"><div class="stat-number">' + (data.watchCount || data.watched_count || 0) + '</div><div class="stat-label">مشاهدة</div></div>'
        + '<div class="stat-item"><div class="stat-number">' + (data.favoriteCount || data.favorites_count || 0) + '</div><div class="stat-label">مفضلة</div></div>'
        + '<div class="stat-item"><div class="stat-number">' + (data.ratingCount || data.ratings_count || 0) + '</div><div class="stat-label">تقييم</div></div>';
    } catch (e) {
      statsEl.innerHTML = '<div class="stat-item"><div class="stat-number">0</div><div class="stat-label">مشاهدة</div></div>'
        + '<div class="stat-item"><div class="stat-number">0</div><div class="stat-label">مفضلة</div></div>'
        + '<div class="stat-item"><div class="stat-number">0</div><div class="stat-label">تقييم</div></div>';
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
