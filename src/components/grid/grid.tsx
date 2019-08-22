
import { Component, Event, EventEmitter, Prop, State, Watch } from '@stencil/core';
import { Column } from './grid-helpers';
import nanoid from 'nanoid/non-secure';

enum Sort {
  Ascending = 'ascending',
  Descending = 'descending',
  None = 'none'
}

@Component({
  tag: 'sui-grid',
  styleUrl: './grid.css'
})
export class SuiGrid {
  /**
   * Grid data
   */
  @Prop() cells: string[][];

  /**
   * Column definitions
   */
  @Prop() columns: Column[];

  /**
   * Caption/description for the grid
   */
  @Prop() description: string;

  /**
   * String ID of labelling element
   */
  @Prop() labelledby: string;

  /**
   * Number of rows in one "page": used to compute pageUp/pageDown key behavior, and when paging is used
   */
  @Prop() pageLength = 30;

  /**
   * Index of the column that best labels a row
   */
  @Prop() titleColumn = 0;

  /**
   * Emit a custom cell edit event
   */
  @Event({
    eventName: 'editCell'
  }) editCellEvent: EventEmitter<{value: string; column: number; row: number;}>;

  /**
   * Emit a custom filter event
   */
  @Event({
    eventName: 'filter'
  }) filterEvent: EventEmitter;

  /**
   * Emit a custom row selection event
   */
  @Event({
    eventName: 'rowSelect'
  }) rowSelectionEvent: EventEmitter;

  /**
   * Save number of selected rows
   */
  @State() selectedRowCount = 0;

  /**
   * Save column sort state
   */
  @State() sortedColumn: number;
  @State() sortState: Sort;

  // save cell focus and edit states
  // active cell refers to the [column, row] indices of the cell
  @State() activeCell: [number, number] = [0, 0];
  @State() isEditing = false;

  /**
   * Save current filter strings
   */
  private _filters: WeakMap<Column, string> = new WeakMap();


  /**
   * Each row needs a unique key to handle DOM insertion/deletion properly in rerenders
   */
  private _rowKeys: WeakMap<string[], string> = new WeakMap();

  /**
   * Save selection state by row
   */
  private _selectedRows: WeakMap<string[], boolean> = new WeakMap();

  /**
   * Save current sorted cell array
   * Will likely need to be moved out of component to allow on-demand and paged grids
   */
  private _sortedCells: string[][];

  @Watch('cells')
  watchCells(newValue: string[][]) {
    this._sortedCells = this.getSortedCells(newValue);

    // reset selectedRowCount
    let selectedRowCount = 0;
    newValue.forEach((row: string[]) => {
      this._selectedRows.has(row) && selectedRowCount++;
      !this._rowKeys.has(row) && this._rowKeys.set(row, nanoid(8));
    });
    this.selectedRowCount = selectedRowCount;
  }

  componentWillLoad() {
    const { cells = [] } = this;
    this._sortedCells = cells;
    // generate unique keys for each row, mapped to the cell[] object
    cells.forEach((row: string[]) => {
      !this._rowKeys.has(row) && this._rowKeys.set(row, nanoid(8));
    });
  }

  render() {
    const {
      columns = [],
      description,
      _selectedRows,
      _sortedCells = [],
      sortedColumn,
      sortState
    } = this;
    const rowSelectionState = this.getSelectionState();
    const activeCellId = this.activeCell.join('-');

    return <div class="grid-container">
      <table role="grid" class="grid">
        {description ? <caption class="grid-caption">{description}</caption> : null}
        <thead role="rowgroup" class="grid-header">
          <tr role="row" class="row">
            <th role="columnheader" class={{'checkbox-cell': true, 'indeterminate': rowSelectionState === 'indeterminate'}}>
              <input
                type="checkbox"
                checked={!!rowSelectionState}
                ref={(el) => {
                  if (rowSelectionState === 'indeterminate') {
                    el.indeterminate = true;
                  }
                }}
                onChange={(event) => this.onSelectAll((event.target as HTMLInputElement).checked)} />
              <span class="selection-indicator"></span>
            </th>
            {columns.map((column, index) => {
              const controls = [];
              const idBase = `col-${index}`;
              const isSortedColumn = sortedColumn === index;
              if (column.sortable) {
                controls.push(<button
                  class={{ 'filter-button': true, 'grid-button': true, [sortState]: isSortedColumn }}
                  onClick={() => this.onSortColumn(index)}
                >
                  <img alt={isSortedColumn ? sortState : 'sort'} id={`${idBase}-sort`} src={`/assets/sort-${isSortedColumn ? sortState : 'none'}.svg`} />
                </button>);
              }
              if (column.filterable) {
                controls.push(
                  <input type="text" class="filter-input" onInput={(event) => this.onFilterInput((event.target as HTMLInputElement).value, column)} />
                );
              }

              return <th role="columnheader" class="cell heading-cell">
                <span id={idBase} class="column-title">{column.name}</span>
                {...controls}
              </th>
            })}
          </tr>
        </thead>
        <tbody role="rowgroup" class="grid-body">
          {_sortedCells.map((cells = [], rowIndex) => {
            const isSelected = !!_selectedRows.get(cells);
            const rowId = this._rowKeys.get(cells);

            return <tr role="row" key={rowId} class={{'row': true, 'selected-row': isSelected}}>
              <td role="gridcell" class="checkbox-cell">
                <input
                  type="checkbox"
                  checked={isSelected}
                  tabIndex={activeCellId === `0-${rowIndex}` ? 0 : -1}
                  onChange={(event) => this.onRowSelect(cells, (event.target as HTMLInputElement).checked)}
                />
                <span class="selection-indicator"></span>
              </td>
              {cells.map((cell, cellIndex) => {
                const isActiveCell = activeCellId === `${cellIndex + 1}-${rowIndex}`;
                return <td
                  role="gridcell"
                  class={{'cell': true, 'editing': this.isEditing && isActiveCell }}
                  id={`cell-${rowIndex}-${cellIndex}`}
                  tabIndex={isActiveCell ? 0 : -1}
                  onClick={() => { this.onCellClick(rowIndex, cellIndex + 1); }}
                  onDblClick={this.onCellDoubleClick.bind(this)}
                >
                  {this.isEditing && isActiveCell
                    ? <input value={cell} class="cell-edit" />
                    : <span class="cell-content">{cell}</span>
                  }
                </td>;
              })}
            </tr>;
          })}
        </tbody>
      </table>
    </div>;
  }

  private getSelectionState(): boolean | 'indeterminate' {
    return this.selectedRowCount === 0 ? false : this.selectedRowCount === this.cells.length ? true : 'indeterminate';
  }

  private getSortedCells(cells: string[][]) {
    if (this.sortedColumn !== undefined && this.sortState !== Sort.None) {
      return [ ...cells ].sort(this.getSortFunction(this.sortedColumn, this.sortState));
    }

    return cells;
  }

  private getSortFunction(columnIndex: number, order: Sort) {
    return function(row1, row2) {
      const a = row1[columnIndex].toLowerCase();
      const b = row2[columnIndex].toLowerCase();
      if (a < b) {
        return order === Sort.Ascending ? -1 : 1;
      }
      else if (a > b) {
        return order === Sort.Ascending ? 1 : -1;
      }
      else {
        return 0;
      }
    }
  }

  private onCellClick(row, column) {
    if (this.activeCell.join('-') === `${column}-${row}`) {
      this.updateEditing(true);
    }
    this.activeCell = [column, row];
  }

  private onCellDoubleClick(event) {
    this.updateEditing(true);
    event.preventDefault();
  }

  private onFilterInput(value: string, column: Column) {
    this._filters.set(column, value);

    const filters = {};
    this.columns.forEach((column, index) => {
      if (column.filterable && this._filters.has(column)) {
        const filterString = this._filters.get(column);
        if (filterString.trim() !== '') {
          filters[index] = filterString;
        }
      }
    });

    this.filterEvent.emit(filters);
  }

  private onRowSelect(row: string[], selected: boolean) {
    this._selectedRows.set(row, selected);
    this.selectedRowCount = this.selectedRowCount + (selected ? 1 : -1);
  }

  private onSelectAll(selected: boolean) {
    this.cells.forEach((row) => {
      this._selectedRows.set(row, selected);
    });
    this.selectedRowCount = selected ? this.cells.length : 0;
  }

  private onSortColumn(columnIndex: number) {
    if (columnIndex === this.sortedColumn) {
      this.sortState = this.sortState === Sort.Descending ? Sort.Ascending : Sort.Descending;
    }
    else {
      this.sortedColumn = columnIndex;
      this.sortState = Sort.Ascending;
    }

    this._sortedCells = this.getSortedCells(this.cells);
  }

  // private updateActiveCell(colIndex, rowIndex): boolean {
  //   if (colIndex !== this.activeCell[0] || rowIndex !== this.activeCell[1]) {
  //     this._callFocus = true;
  //     this.activeCell = [colIndex, rowIndex];
  //     return true;
  //   }

  //   return false;
  // }

  private updateEditing(editing: boolean) {
    this.isEditing = editing;
  }
}
