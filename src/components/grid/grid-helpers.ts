
export interface Column {
  name: string;
  filterable?: boolean;
  sortable?: boolean;
  editable?: boolean;
}

/* Helper function to filter data by column */
export function filterByColumn(filters: { [columnIndex: number]: string }, data: string[][]) {
  return data.filter((row) => {
    Object.keys(filters).forEach((columnIndex) => {
      const filterCell = row[columnIndex];
      if (filterCell.toLowerCase().indexOf(filters[columnIndex].trim().toLowerCase()) < 0) {
        return false;
      }
    });
    return true;
  });
}