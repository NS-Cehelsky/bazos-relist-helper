* {
  box-sizing: border-box;
}

body {
  margin: 0;
  width: 340px;
  max-height: 480px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  color: #222;
  background: #fafafa;
}

header {
  padding: 10px 12px;
  background: #2e7d32;
  color: #fff;
}

header h1 {
  margin: 0;
  font-size: 15px;
}

main {
  max-height: 380px;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  padding: 20px 10px;
  text-align: center;
  color: #666;
  line-height: 1.5;
}

.listing-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.listing-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.listing-item .thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 4px;
  background: #eee;
  flex-shrink: 0;
}

.listing-item .info {
  flex: 1;
  min-width: 0;
}

.listing-item .title {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.listing-item .meta {
  color: #666;
  font-size: 11px;
  display: flex;
  gap: 8px;
}

.listing-item .actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.listing-item .actions button {
  font-size: 11px;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f5f5f5;
  cursor: pointer;
  white-space: nowrap;
}

.listing-item .actions button:hover {
  background: #eee;
}

footer {
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.danger-btn {
  width: 100%;
  padding: 8px;
  background: #c62828;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.danger-btn:hover {
  background: #b71c1c;
}
