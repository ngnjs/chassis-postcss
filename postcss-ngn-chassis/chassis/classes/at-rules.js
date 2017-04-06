const postcss = require('postcss')
const ChassisUtils = require('../utilities')

class ChassisAtRules {
  constructor (project) {
    this.project = project
    this.layout = project.layout
    this.typography = project.typography
    this.viewport = project.viewport

    this.mixins = {

      /**
       * @mixin init
       * Generate core stylesheet from user configuration
       * @param  {object} line
       * Line and column at which mixin was called
       * @param  {array} args
       * additional params passed to mixin
       * @return {AST}
       */
      init: (line, args) => {
        // console.log(args);
        return this.project.coreStyles
      },

      /**
       * @mixin constrainWidth
       * @param  {object}  line
       * Line and column at which mixin was called
       * @param  {Boolean} [hasPadding=true]
       * Whether or not to add layout gutter to left and right
       * @return {array} of decls
       */
      constrainWidth: (line, hasPadding = true) => {
        let decls = [
          ChassisUtils.newDecl('width', '100%'),
          ChassisUtils.newDecl('min-width', `${this.layout.minWidth}px`),
          ChassisUtils.newDecl('max-width', `${this.layout.maxWidth}px`),
          ChassisUtils.newDecl('margin', '0 auto')
        ]

        if (hasPadding) {
          decls = [
            ...decls,
            ChassisUtils.newDecl('padding-left', this.layout.gutter),
            ChassisUtils.newDecl('padding-right', this.layout.gutter)
          ]
        }

        return decls
      },

      /**
       * @mixin mediaQuery
       * @param  {object} line
       * Line and column at which mixin was called
       * @param  {object} config
       * media query params. Shape: {name: {string}, params: {string}, nodes: {array}}
       * @param  {array} nodes
       * rules to add inside media query
       * @return {CSS}
       */
      mediaQuery: (line, config, nodes) => {
        let type = config[0]
        let viewport = config[1]

        if (!this.viewport.validateMediaQuery(line, type, viewport)) {
          return
        }

        let dimension = NGN.coalesce(config[2], 'width')

        return this.viewport.getMediaQuery(type, viewport, nodes, dimension)
      },

      /**
       * @mixin hide
       * Hide element
       * Sets the following properties:
       * display: none;
       * visibility: hidden;
       * opacity: 0;
       * @return {decls}
       */
      hide: () => {
        return [
          ChassisUtils.newDecl('display', 'none'),
          ChassisUtils.newDecl('visibility', 'hidden'),
          ChassisUtils.newDecl('opacity', '0')
        ]
      },

      /**
       * @mixin show
       * Show element
       * Sets the following properties:
       * display: {string};
       * visibility: visible;
       * opacity: 1;
       * @param {array} args
       * Accepts CSS box model property values
       * @return {decls}
       */
      show: (line, args) => {
        let boxModel = NGN.coalesce(args, 'block')
        // TODO: Handle invalid box-model values

        return [
          ChassisUtils.newDecl('display', boxModel),
          ChassisUtils.newDecl('visibility', 'visible'),
          ChassisUtils.newDecl('opacity', '1')
        ]
      },

      ellipsis: () => {
        return [
          ChassisUtils.newDecl('white-space', 'nowrap'),
          ChassisUtils.newDecl('overflow', 'hidden'),
          ChassisUtils.newDecl('text-overflow', 'ellipsis')
        ]
      },

      setTypography: (rule, line, args) => {
        let config = {
          alias: 'root'
        }

        if (args) {
          let alias = NGN.coalesce(args.find(arg => ['root', 'small', 'large', 'larger', 'largest'].includes(arg)), 'root')
          let multiplier = NGN.coalesce(args.find(arg => typeof arg === 'number'), 1)
          let addMargin = NGN.coalesce(args.includes('add-margin'), false)

          if (!alias) {
            console.error('[ERROR] Chassis At Rule set-typography must include a size alias. Valid values include "root", "small", "large", "larger", and "largest"')
            return ''
          }

          config.alias = alias

          if (multiplier) {
            config.multiplier = multiplier
          }

          if (addMargin) {
            config.addMargin = true
          }
        }

        return this.typography.getTypographyRules(rule, line, config)
      },

      inlineLayout: (rule, line, args) => {
        let config = {
          alias: 'root'
        }

        if (args) {
          let stripMargin = NGN.coalesce(args.includes('no-margin'), true)
          let stripHorizontalMargin = NGN.coalesce(args.includes('no-horizontal-margin'), true)
          let stripVerticalMargin = NGN.coalesce(args.includes('no-vertical-margin'), true)

          let stripPadding = NGN.coalesce(args.includes('no-padding'), false)

          let multiLine = NGN.coalesce(args.includes('multi-line'), false)

          let setHeight = NGN.coalesce(args.includes('set-height'), false)

          if (stripHorizontalMargin) {
            config.stripHorizontalMargin = stripHorizontalMargin
          }

          if (stripVerticalMargin) {
            config.stripVerticalMargin = stripVerticalMargin
          }

          if (stripMargin || (stripHorizontalMargin && stripVerticalMargin)) {
            delete config.stripHorizontalMargin
            delete config.stripVerticalMargin
            config.stripMargin = true
          }

          if (stripPadding) {
            config.stripPadding = true
          }

          if (multiLine) {
            config.multiLine = true
          }

          if (setHeight) {
            config.setHeight = true
          }
        }

        return this.layout.getInlineElementStyles(rule, line, config)
      },

      blockLayout: (rule, line, args) => {
        let config = {
          alias: 'root'
        }

        if (args) {
          let stripPadding = NGN.coalesce(args.includes('no-padding'), true)
          let stripHorizontalPadding = NGN.coalesce(args.includes('no-horizontal-padding'), true)
          let stripVerticalPadding = NGN.coalesce(args.includes('no-vertical-padding'), true)
          let stripMargin = NGN.coalesce(args.includes('no-margin'), false)

          if (stripHorizontalPadding) {
            config.stripHorizontalPadding = stripHorizontalPadding
          }

          if (stripVerticalPadding) {
            config.stripVerticalPadding = stripVerticalPadding
          }

          if (stripPadding || (stripHorizontalPadding && stripVerticalPadding)) {
            delete config.stripHorizontalPadding
            delete config.stripVerticalPadding
            config.stripPadding = true
          }

          if (stripMargin) {
            config.stripMargin = true
          }
        }

        return this.layout.getBlockElementStyles(rule, line, config)
      }
    }
  }

  /**
   * @method _addWidthConstraintMediaQueries
   * Added to prevent shrinking or growing gutters when constrainWidth mixin is
   * called on an element
   * @param {object} input
   * PostCss AST
   * @param {string} selector
   * Element to apply media queries to
   * @private
   */
  _addWidthConstraintMediaQueries (input, selector) {
    input.insertAfter(selector, ChassisUtils.newAtRule({
      name: 'media',
      params: `screen and (max-width: ${this.layout.minWidth}px)`,
      nodes: [
        ChassisUtils.newRule(selector, [
          ChassisUtils.newDeclObj('padding-left', this.layout.getGutterLimit(this.layout.minWidth)),
          ChassisUtils.newDeclObj('padding-right', this.layout.getGutterLimit(this.layout.minWidth))
        ])
      ]
    }))

    input.insertAfter(selector, ChassisUtils.newAtRule({
      name: 'media',
      params: `screen and (min-width: ${this.layout.maxWidth}px)`,
      nodes: [
        ChassisUtils.newRule(selector, [
          ChassisUtils.newDeclObj('padding-left', this.layout.getGutterLimit(this.layout.maxWidth)),
          ChassisUtils.newDeclObj('padding-right', this.layout.getGutterLimit(this.layout.maxWidth))
        ])
      ]
    }))
  }

  /**
   * @method process
   * Handle @chassis at-rules
   * @param {object} rule
   * PostCss AST
   * @param {object} input
   * PostCss AST
   */
  process (rule, input) {
    let line = Object.keys(rule.source.start).map(key => `${key}: ${rule.source.start[key]}`).join(', ')
    let params = rule.params.split(' ')
    let mixin = params[0]
    let args = params.length > 1 ? params.slice(1) : null
    let nodes = NGN.coalesce(rule.nodes || [])
    let css
    let append = false

    switch (mixin) {
      case 'init':
        rule.replaceWith(this.mixins.init(line, args))
        break

      case 'constrain-width':
        this._addWidthConstraintMediaQueries(input, rule.parent)
        rule.replaceWith(this.mixins.constrainWidth(line, args && !args.includes('no-padding')))
        break

      case 'media-query':
        rule.replaceWith(this.mixins.mediaQuery(line, args, nodes))
        break

      case 'set-typography':
        rule.parent.parent.append(this.mixins.setTypography(rule, line, args))
        rule.remove()
        break

      case 'block-layout':
        rule.parent.append(this.mixins.blockLayout(rule, line, args))
        break

      case 'inline-layout':
        rule.parent.append(this.mixins.inlineLayout(rule, line, args))
        break

      case 'hide':
        rule.parent.append(this.mixins.hide())
        break

      case 'show':
        rule.parent.append(this.mixins.show(line, args))
        break

      case 'ellipsis':
        rule.parent.append(this.mixins.ellipsis())
        break

      case 'z-index':
        console.log('apply calculated z-index')
        break

      default:
        console.error(`Chassis At-Rules: At-Rule ${mixin} not found`)
        rule.remove()
    }
  }
}

module.exports = ChassisAtRules