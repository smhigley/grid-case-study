
export interface PagerOptions {
  currentPage: number;
  totalPages: number;
}

export function renderPager(options: PagerOptions): JSX.Element {
  const { currentPage = 1, totalPages = 1 } = options;
  console.log('rendering pager');
  if (totalPages === 1) {
    console.log('no pager, total pages:', totalPages);
    return null;
  }

  return <div class="grid-pager">
    <button class="grid-pager-prev" disabled={currentPage === 1}>Previous</button>
    <button class="grid-pager-next" disabled={currentPage === totalPages}>Next</button>
  </div>
}
