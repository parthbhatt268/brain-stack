import { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ categories, onSearch, onClear, notFound, isSearching, hasError }) {
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('all');

  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;
    onSearch(trimmed, category);
  }

  function handleClear() {
    setQuery('');
    setCategory('all');
    onClear();
  }

  const hasQuery = query.length > 0;

  return (
    <form
      className="search-bar"
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search your Brain Stack"
    >
      {/* Category filter */}
      <select
        className="search-bar__category"
        value={category}
        onChange={e => setCategory(e.target.value)}
        aria-label="Filter by category"
        disabled={isSearching}
      >
        <option value="all">All</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <span className="search-bar__divider" aria-hidden="true" />

      {/* Query input */}
      <input
        className="search-bar__input"
        type="text"
        placeholder="Ask anything about your saved links…"
        value={query}
        onChange={e => { setQuery(e.target.value); if (notFound) onClear(); }}
        aria-label="Search query"
        autoComplete="off"
        spellCheck={false}
        disabled={isSearching}
      />

      {/* Clear — only when there's content and not searching */}
      {hasQuery && !isSearching && (
        <button
          type="button"
          className="search-bar__icon-btn search-bar__clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}

      {/* Submit / loading */}
      <button
        type="submit"
        className={`search-bar__submit${isSearching ? ' search-bar__submit--loading' : ''}`}
        disabled={!hasQuery || isSearching}
        aria-label={isSearching ? 'Searching…' : 'Search'}
        title={isSearching ? 'Searching…' : 'Search'}
      >
        {isSearching
          ? <Loader2 size={15} className="search-bar__spinner" />
          : <Search size={15} />
        }
      </button>

      {/* Not-found toast */}
      {notFound && (
        <p className="search-bar__not-found" role="status">
          No matching node found — try rephrasing or selecting a different category.
        </p>
      )}

      {/* Error toast */}
      {hasError && (
        <p className="search-bar__not-found search-bar__not-found--error" role="alert">
          Search failed — please try again.
        </p>
      )}
    </form>
  );
}
