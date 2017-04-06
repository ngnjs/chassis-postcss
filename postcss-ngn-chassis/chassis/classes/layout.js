const ChassisUtils = require('../utilities')

class ChassisLayout {
  constructor (viewport, typography, settings) {
    this.viewport = viewport
    this.typography = typography
    this.settings = settings
  }

  /**
   * @property {string} gutter
   * Project side-gutter width CSS Property value
   * @readonly
   */
  get gutter () {
    if (!this.settings.gutter) {
      console.warn('[WARNING] Chassis Layout: Gutter Value has not been set!')
      return ''
    }

    return this.settings.gutter
  }

  /**
   * @property {number} minWidth
   * Project min-width in pixels
   * @readonly
   */
  get minWidth () {
    if (!this.settings.minWidth) {
      console.warn('[WARNING] Chassis Layout: Minimum Width Value has not been set!')
      return ''
    }

    return this.settings.minWidth
  }

  /**
   * @property {number} maxWidth
   * Project max-width in pixels
   * @readonly
   */
  get maxWidth () {
    if (!this.settings.maxWidth) {
      console.warn('[WARNING] Chassis Layout: Maximum Width Value has not been set!')
      return ''
    }

    return this.settings.maxWidth
  }

  /**
   * @method getMargin
   * Get calculated GR-Typography margin-bottom value
   * @param {string} type
   * "container" or "block"; containers are top-level elements, blocks are
   * children
   * @param {string} fontSizeAlias
   * font size alias to use as a base for calculation
   * Accepts root, small, large, larger, largest
   * @param {number} upperBound
   * Upper bound of current viewport width range
   * @return {number} in ems
   */
  getMargin (type, fontSizeAlias, upperBound) {
    switch (type) {
      case 'container':
        return this.typography.getLineHeight(fontSizeAlias, upperBound, true) * this.typography.typeScaleRatio
        break

      case 'block':
        return this.typography.getLineHeight(fontSizeAlias, upperBound, true)
        break

      default:
        return this.typography.getFontSize(fontSizeAlias, upperBound, true)
    }
  }

  /**
   * @method getPadding
   * Get calculated GR-Typography padding value (left or right)
   * @param {string} type
   * TODO: Add type description
   * @param {string} fontSize
   * Current font size type to use as a base for calculation
   * Accepts root, small, large, larger, largest
   * @param {number} upperBound
   * Upper bound of current viewport width range
   */
  getPadding (type, fontSize, upperBound) {
    console.log('TODO: Finish padding getter!');
  }

  /**
   * @method getGutterLimit
   * Get a pixel-value for gutter width at min or max viewport width ranges
   * This prevents gutters from shrinking or enlarging when the window has
   * shrunk below the minimum or grown larger than the maximum layout width
   * @param {number} width in px
   * Width of layout at current viewport size
   * Only applicable at min or max
   */
  getGutterLimit (width) {
    let unit = ChassisUtils.getUnit(this.gutter)

    switch (unit) {
      case 'vw':
        return `calc(${width}px * ${parseFloat(this.gutter)} / 100)`
        break

      case '%':
        return `calc(${width}px * ${parseFloat(this.gutter)} / 100)`
        break

      case 'px':
        return this.gutter
        break

      case 'em':
        return this.gutter
        break

      case 'rem':
        return `${parseFloat(this.gutter) * (this.typography.baseFontSize * this.typography.globalMultiplier)}px`
        break

      default:
        console.error(`"${unit}" units cannot be used for Layout Gutter. Please use vw, %, px or rem instead.`)
    }
  }

  /**
   * @method getContainerStyles
   * Get default decls for Container elements
   * @param {string} range
   * Current viewport width range
   * @return {rule}
   */
  getDefaultContainerStyles (range) {
    return ChassisUtils.newRule('.chassis section, .chassis nav, .chassis form', [
      ChassisUtils.newDeclObj('margin-bottom', `${this.getMargin('container', 'root', range.upperBound)}em`)
    ])
  }

  /**
   * @method getBlockElementStyles
   * Get default decls for Block elements
   * @param {string} range
   * Current viewport width range
   * @return {rule}
   */
  getDefaultBlockElementStyles (range) {
    return ChassisUtils.newRule('.chassis nav section, .chassis section nav, .chassis nav nav, .chassis article, .chassis fieldset, .chassis figure, .chassis pre, .chassis blockquote, .chassis table, .chassis canvas, .chassis embed', [
      ChassisUtils.newDeclObj('margin-bottom', `${this.getMargin('block', 'root', range.upperBound)}em`)
    ])
  }

  _parsePropertyValues (array) {
    return array.map(value => value === 0 ? 0 : `${value}em`).join(' ')
  }

  getInlineElementStyles (rule, line, config) {
    let alias = NGN.coalesce(config.alias, 'root')
    let stripPadding = NGN.coalesce(config.stripPadding, false)
    let stripMargin = NGN.coalesce(config.stripMargin, false)
    let stripVerticalMargin = NGN.coalesce(config.stripVerticalMargin, false)
    let stripHorizontalMargin = NGN.coalesce(config.stripHorizontalMargin, false)

    let multiLine = NGN.coalesce(config.multiLine, false)
    let setHeight = NGN.coalesce(config.setHeight, false)

    let css = []

    this.viewport.widthRanges.forEach((range, index) => {
      let fontSize = this.typography.getFontSize(alias, range.upperBound, true)
      let baseLineHeight = this.typography.getLineHeight(alias, range.upperBound, true) / fontSize

      if (index === 1) {
        if (setHeight) {
          if (multiLine) {
            css.push(ChassisUtils.newDecl(
              'height',
              `${baseLineHeight}em`
            ))
          } else {
            css.push(ChassisUtils.newDecl(
              'height',
              `${baseLineHeight * this.typography.typeScaleRatio}em`
            ))
          }
        }

        if (!stripPadding) {
          let padding = [0, baseLineHeight / 2]

          if (multiLine) {
            padding[0] = ((baseLineHeight * this.typography.typeScaleRatio) - baseLineHeight) / 2
          }

          css.push(ChassisUtils.newDecl(
            'padding',
            this._parsePropertyValues(padding)
          ))
        }

        if (!stripMargin) {
          let margin = [0, baseLineHeight / 2, baseLineHeight, 0]

          if (stripVerticalMargin) {
            margin[2] = 0
          }

          if (stripHorizontalMargin) {
            margin[1] = 0
          }

          css.push(ChassisUtils.newDecl(
            'margin',
            this._parsePropertyValues(margin)
          ))
        }

        if (multiLine) {
          css.push(ChassisUtils.newDecl(
            'line-height',
            `${baseLineHeight}em`
          ))
        } else {
          css.push(ChassisUtils.newDecl(
            'line-height',
            `${baseLineHeight * this.typography.typeScaleRatio}em`
          ))
        }
      } else {
        // TODO: Add media queries
      }
    })

    console.log(css);
    return css
  }

  getBlockElementStyles (rule, line, config) {
    let alias = NGN.coalesce(config.alias, 'root')
    let stripMargin = NGN.coalesce(config.stripMargin, false)
    let stripPadding = NGN.coalesce(config.stripPadding, false)
    let stripVerticalPadding = NGN.coalesce(config.stripVerticalPadding, false)
    let stripHorizontalPadding = NGN.coalesce(config.stripHorizontalPadding, false)

    let css = []

    this.viewport.widthRanges.forEach((range, index) => {
      let fontSize = this.typography.getFontSize(alias, range.upperBound, true)
      let lineHeight = this.typography.getLineHeight(alias, range.upperBound, true) / fontSize

      if (index === 1) {
        if (!stripMargin) {
          css.push(ChassisUtils.newDecl('margin', `0 0 ${lineHeight}em 0`))
        }

        if (!stripPadding) {
          let padding = [(lineHeight / this.typography.typeScaleRatio) / 2, 1]

          if (stripVerticalPadding) {
            padding[0] = 0
          }

          if (stripHorizontalPadding) {
            padding[1] = 0
          }

          css.push(ChassisUtils.newDecl(
            'padding',
            this._parsePropertyValues(padding)
          ))
        }
      } else {
        // TODO: Add Media Queries
      }
    })

    console.log(css);
    return css
  }
}

module.exports = ChassisLayout