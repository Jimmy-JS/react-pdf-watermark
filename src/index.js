import PdfJsLib from 'pdfjs-dist'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class Pdf extends Component {
  static propTypes = {
    file: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]).isRequired,
    watermark: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func
    ]),
    watermarkOptions: PropTypes.object,
    page: PropTypes.number,
    onDocumentComplete: PropTypes.func,
    onPageRenderComplete: PropTypes.func,
    onChangePage: PropTypes.func,
    forceRerender: PropTypes.bool,
    canvasWidth: PropTypes.string,
    canvasHeight: PropTypes.string,
    scale: PropTypes.number,
    cMapUrl: PropTypes.string,
    cMapPacked: PropTypes.bool,
    className: PropTypes.string,
    workerSrc: PropTypes.string
  }

  static defaultProps = {
    page: 1,
    watermark: null,
    watermarkOptions: {},
    onDocumentComplete: null,
    onPageRenderComplete: null,
    onChangePage: null,
    forceRerender: false,
    canvasWidth: '',
    canvasHeight: '',
    scale: 1,
    cMapUrl: '../node_modules/pdfjs-dist/cmaps/',
    cMapPacked: false,
    className: '',
    workerSrc: '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js'
  }

  state = {
    pdf: null,
    numPages: 0
  }

  renderTask = null

  componentDidMount() {
    this.renderPDF()
  }

  componentWillReceiveProps(newProps) {
    const { page, scale, forceRerender, onChangePage } = this.props
    const { pdf } = this.state

    if (
      ((newProps.page !== page) || (newProps.scale !== scale)) &&
      pdf
    ) {
      pdf.getPage(newProps.page).then((p) => {
        this.drawPDF(p)

        if (onChangePage) onChangePage(p.pageNumber)
      })
    }

    if (newProps.forceRerender && newProps.forceRerender !== forceRerender && pdf) {
      this.renderPDF()
    }
  }

  renderPDF = () => {
    const { file, page, cMapUrl, cMapPacked, onDocumentComplete, workerSrc } = this.props
    PdfJsLib.GlobalWorkerOptions.workerSrc = workerSrc
    PdfJsLib.getDocument({ url: file, cMapUrl, cMapPacked }).then((pdf) => {
      this.setState({ pdf, numPages: pdf._pdfInfo.numPages })

      if (onDocumentComplete) onDocumentComplete(pdf._pdfInfo.numPages)

      pdf.getPage(page).then(p => this.drawPDF(p))
    })
  }

  drawPDF = (page) => {
    const { scale, canvasWidth, canvasHeight } = this.props
    const viewport = page.getViewport(scale)
    const { canvas } = this
    const canvasContext = canvas.getContext('2d')

    canvas.width = viewport.width
    canvas.height = viewport.height
    if (canvasWidth || canvasHeight) {
      canvas.style.width = canvasWidth
      canvas.style.height = canvasHeight
    }

    const renderContext = { canvasContext, viewport }

    if (this.renderTask) {
      this.renderTask.cancel()
    }

    this.renderPage(page, renderContext)
  }

  renderPage = (page, renderContext) => {
    const { onPageRenderComplete, watermark } = this.props
    const { numPages } = this.state
    const { canvas } = this
    const canvasContext = canvas.getContext('2d')
    this.renderTask = page.render(renderContext)
    this.renderTask.promise.then(() => {
      if (onPageRenderComplete) onPageRenderComplete(numPages, page.pageNumber, canvas, canvasContext)

      if (watermark) {
        if (typeof watermark === 'function') watermark(canvas, canvasContext)
        else if (typeof watermark === 'string') this.renderBasicWatermark()
      }
    }).catch((err) => {
      this.renderTask = null
      if (err.name === 'RenderingCancelledException') {
        this.renderPage(page, renderContext)
      }
    })
  }

  renderBasicWatermark = () => {
    const { canvas } = this
    const context = canvas.getContext('2d')
    const { watermark, watermarkOptions } = this.props

    let options = {
      transparency: 0.5,
      fontSize: 55,
      fontStyle: 'Bold',
      fontFamily: 'Arial'
    }
    options = { ...options, ...watermarkOptions }

    context.globalAlpha = options.transparency
    context.font = `${options.fontSize}px ${options.fontStyle} ${options.fontFamily}`
    context.translate(canvas.width / 2, canvas.height / 2)

    const metrics = context.measureText(watermark)
    context.fillText(watermark, -metrics.width / 2, (55 / 2))
  }

  render() {
    const { className } = this.props
    return <canvas ref={(canvas) => { this.canvas = canvas }} className={className} />
  }
}
