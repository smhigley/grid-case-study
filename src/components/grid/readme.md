# sui-grid



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute             | Description                                                                                                                                                                                                                           | Type                                                                                   | Default     |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------- |
| `actionsColumn`     | `actions-column`      | Properties for Usability test case behaviors: *                                                                                                                                                                                       | `boolean`                                                                              | `undefined` |
| `cells`             | --                    | Grid data                                                                                                                                                                                                                             | `string[][]`                                                                           | `undefined` |
| `columns`           | --                    | Column definitions                                                                                                                                                                                                                    | `Column[]`                                                                             | `undefined` |
| `description`       | `description`         | Caption/description for the grid                                                                                                                                                                                                      | `string`                                                                               | `undefined` |
| `editOnClick`       | `edit-on-click`       |                                                                                                                                                                                                                                       | `boolean`                                                                              | `undefined` |
| `editable`          | `editable`            |                                                                                                                                                                                                                                       | `boolean`                                                                              | `true`      |
| `gridType`          | `grid-type`           | Grid type: grids have controlled focus and fancy behavior, tables are simple static content                                                                                                                                           | `"grid" \| "table"`                                                                    | `undefined` |
| `headerActionsMenu` | `header-actions-menu` |                                                                                                                                                                                                                                       | `boolean`                                                                              | `undefined` |
| `initialRowIndex`   | `initial-row-index`   | For virutalized grids and paged grids, used to determine the current row indices of the cells array                                                                                                                                   | `number`                                                                               | `0`         |
| `labelledBy`        | `labelled-by`         | String ID of labelling element                                                                                                                                                                                                        | `string`                                                                               | `undefined` |
| `pageLength`        | `page-length`         | Number of rows in one "page": used to compute pageUp/pageDown key behavior, and when paging is used                                                                                                                                   | `number`                                                                               | `30`        |
| `renderCustomCell`  | --                    | Custom function to control the render of cell content                                                                                                                                                                                 | `(content: string, colIndex: number, rowIndex: number) => string \| HTMLElement`       | `undefined` |
| `rowSelection`      | `row-selection`       |                                                                                                                                                                                                                                       | `RowSelectionPattern.Aria \| RowSelectionPattern.Checkbox \| RowSelectionPattern.None` | `undefined` |
| `totalRows`         | `total-rows`          | Optional: total rows. Will default to calculating based on cells                                                                                                                                                                      | `number`                                                                               | `undefined` |
| `virtualized`       | `virtualized`         | If set to true and the total number of rows is greater than the page length + a buffer, rows will only be rendered to the DOM on demand. If rows are in view without data provided in the `cells` property, they will show as loading | `boolean`                                                                              | `false`     |


## Events

| Event        | Description                       | Type                |
| ------------ | --------------------------------- | ------------------- |
| `filter`     | Emit a custom filter event        | `CustomEvent<void>` |
| `pageChange` | Emit a page change event          | `CustomEvent<void>` |
| `rowSelect`  | Emit a custom row selection event | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
