const DetailerComponent = require('../component')

class TestComponent extends DetailerComponent {
	constructor (project, parent, nodes) {
		let spec = 'test'
		
		super(project, spec, parent, nodes)
	}
}

module.exports = TestComponent
