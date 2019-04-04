# react-pdf-js

`react-pdf-watermark` provides a component for rendering PDF documents using `mozilla/pdf.js` and ability to adding watermark to PDF. Written for React 15/16 and ES2015.

This package is originally built by `mikecousins/react-pdf-js` with a number of enhancement:
* Added hook `onPageRenderComplete()` for determine whether the page is loaded onCanvas.
* Watermark - For displaying watermark on top of original PDF.
* Add check handler for duplicated canvas load.
* Add custom pdf.worker file

## Usage

Install with `npm install react-pdf-watermark`

## Example

Use it in your app (showing some basic pagination as well):

```js
import React from 'react';
import PDF from 'react-pdf-watermark';

class MyPdfViewer extends React.Component {
  state = {};

  handlePrevious = () => {
    this.setState({ page: this.state.page - 1 });
  }

  handleNext = () => {
    this.setState({ page: this.state.page + 1 });
  }

  renderPagination = (page, pages) => {
    let previousButton = <li className="previous" onClick={this.handlePrevious}><a href="#"><i className="fa fa-arrow-left"></i> Previous</a></li>;
    if (page === 1) {
      previousButton = <li className="previous disabled"><a href="#"><i className="fa fa-arrow-left"></i> Previous</a></li>;
    }
    let nextButton = <li className="next" onClick={this.handleNext}><a href="#">Next <i className="fa fa-arrow-right"></i></a></li>;
    if (page === pages) {
      nextButton = <li className="next disabled"><a href="#">Next <i className="fa fa-arrow-right"></i></a></li>;
    }
    return (
      <nav>
        <ul className="pager">
          {previousButton}
          {nextButton}
        </ul>
      </nav>
    );
  }

  render() {
    let pagination = null;
    if (this.state.pages) {
      pagination = this.renderPagination(this.state.page, this.state.pages);
    }
    return (
      <div>
        <PDF
          file="test.pdf"
          page={this.state.page}
          watermark="WATERMARK GOES HERE.."
          watermarkOptions={{
            transparency: 0.5,
            fontSize: 55,
            fontStyle: 'Bold',
            fontFamily: 'Arial'
          }}
          onDocumentComplete={ () => { /* Do anything on document loaded like remove loading, etc */ }}
          onPageRenderComplete={(pages, page) => this.setState({ page, pages })}
        />
        {pagination}
      </div>
    )
  }
}

export default MyPdfViewer;
```

## Custom Watermark Styling

For more watermark styling, you can customize it yourself by creating watermark render function that will receipt canvas and context as params.

```js
  ...

  applyWatermark = (canvas, context) => {
    context.globalAlpha = 0.15
    context.font = '55px bold Arial'
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate(-Math.atan(canvas.height / canvas.width)) // Rotate watermark to show diagonally

    const text = 'Strictly Confidential. Not to be circulated'
    metrics = context.measureText(text)
    context.fillText(text, -metrics.width / 2, (55 / 2))
  }

  ...
```

And then apply it to your PDF component:
```js
  <PDF
    file="test.pdf"
    ...
    watermark={this.applyWatermark}
  />
```
