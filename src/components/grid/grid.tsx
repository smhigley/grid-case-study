
import { Component, Event, EventEmitter, Listen, Prop, State, Watch } from '@stencil/core';
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

  /*
   * DOM Refs:
   */
  // Save a reference to whatever element should receive focus
  private _focusRef: HTMLElement;

  /*
   * Private properties used to trigger DOM methods in the correct lifecycle callback
   */
  private _callFocus = false;
  private _callInputSelection = false;

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

  componentDidUpdate() {
    // handle focus
    this._callFocus && this._focusRef && this._focusRef.focus();
    this._callFocus = false;

    // handle input text selection
    this._callInputSelection && this._focusRef && (this._focusRef as HTMLInputElement).select();
    this._callInputSelection = false;
  }

  @Listen('focusout')
  onBlur(event: FocusEvent) {
    if (this.isEditing && event.relatedTarget && event.relatedTarget !== this._focusRef) {
      this.updateEditing(false, false);
    }
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
        <tbody role="rowgroup" class="grid-body" onKeyDown={this.onCellKeydown.bind(this)}>
          {_sortedCells.map((cells = [], rowIndex) => {
            const isSelected = !!_selectedRows.get(cells);
            const rowId = this._rowKeys.get(cells);

            return <tr role="row" key={rowId} class={{'row': true, 'selected-row': isSelected}}>
              <td role="gridcell" class="checkbox-cell">
                <input
                  type="checkbox"
                  checked={isSelected}
                  tabIndex={activeCellId === `0-${rowIndex}` ? 0 : -1}
                  ref={activeCellId === `0-${rowIndex}` ? (el) => { this._focusRef = el; } : null}
                  onChange={(event) => this.onRowSelect(cells, (event.target as HTMLInputElement).checked)}
                  onKeyDown={(event) => { (event.key === ' ' || event.key === 'Enter') && event.stopPropagation(); }}
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
                  ref={isActiveCell && !this.isEditing ? (el) => { this._focusRef = el; } : null}
                  onClick={() => { this.onCellClick(rowIndex, cellIndex + 1); }}
                  onDblClick={this.onCellDoubleClick.bind(this)}
                >
                  {this.isEditing && isActiveCell
                    ? <input value={cell} class="cell-edit" onKeyDown={this.onInputKeyDown.bind(this)} ref={(el) => this._focusRef = el} />
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
      this.updateEditing(true, true);
    }
    this.activeCell = [column, row];
  }

  private onCellDoubleClick(event) {
    this.updateEditing(true, true);
    event.preventDefault();
  }

  private onCellKeydown(event: KeyboardEvent) {
    const { pageLength } = this;
    let [colIndex, rowIndex] = this.activeCell;
    switch(event.key) {
      case 'ArrowUp':
        rowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        rowIndex = Math.min(this.cells.length - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        colIndex = Math.max(0, colIndex - 1);
        break;
      case 'ArrowRight':
        colIndex = Math.min(this.columns.length, colIndex + 1);
        break;
      case 'Home':
        colIndex = 0;
        break;
      case 'End':
        colIndex = this.columns.length;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.updateEditing(true, true);
        break;
      case 'PageUp':
        rowIndex = Math.max(0, rowIndex - pageLength);
        break;
      case 'PageDown':
        rowIndex = Math.min(this.cells.length - 1, rowIndex + pageLength);
        break;
    }

    if (this.updateActiveCell(colIndex, rowIndex)) {
      event.preventDefault();
    }
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

  private onInputKeyDown(event: KeyboardEvent) {
    // allow input to handle its own keystrokes
    event.stopPropagation();

    const { key, shiftKey } = event;

    // switch out of edit mode on enter or escape
    if (key === 'Escape' || key === 'Enter') {
      this.updateEditing(false, true);
    }

    if (key === 'Enter') {
      this.editCellEvent.emit({value: (event.target as HTMLInputElement).value, column: this.activeCell[0] - 1, row: this.activeCell[1]});
    }

    // allow tab and shift+tab to move through cells in a row
    else if (key === 'Tab') {
      if (shiftKey && this.activeCell[0] > 0) {
        this.updateActiveCell(this.activeCell[0] - 1, this.activeCell[1]);
        event.preventDefault();
      }
      else if (!shiftKey && this.activeCell[0] < this.columns.length - 1) {
        this.updateActiveCell(this.activeCell[0] + 1, this.activeCell[1]);
        event.preventDefault();
      }
    }
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

  private updateActiveCell(colIndex, rowIndex): boolean {
    if (colIndex !== this.activeCell[0] || rowIndex !== this.activeCell[1]) {
      this._callFocus = true;
      this.activeCell = [colIndex, rowIndex];
      return true;
    }

    return false;
  }

  private updateEditing(editing: boolean, callFocus: boolean) {
    this.isEditing = editing;
    this._callFocus = callFocus;
    this._callInputSelection = editing && callFocus;
  }
}
