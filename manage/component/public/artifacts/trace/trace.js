Vue.view("data-trace-viewer", {
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},  
	name: "Trace Viewer",
	category: "Data",
	description: "Visualize trace mode",
	icon: "link",
	created: function() {
		//this.watchArray();
		this.loadData();
		this.watchAll();
	},
	data: function() {
		return {
			steps: [],
			showTime: false,
			showInvokeMapping: false,
			selected: null,
			search: null,
			data: null,
			subscriptions: []
		}
	},
	beforeDestroy: function() {
		this.unsubscribe();
	},
	methods: {
		setData: function(value) {
			if (value != null) {
				try {
					value = JSON.parse(value);
				}
				catch (exception) {
					// ignore
				}
			}
			Vue.set(this, 'data', value);
		},
		getEvents: function() {
			var message = this.$services.swagger.resolve("nabu.providers.trace.persisted.crud.traceInstanceMessage.types.output");
			return {
				showInput: message,
				showOutput: message
			};
		},
		configurator: function() {
			return "data-trace-viewer-configure"
		},
		unsubscribe: function() {
			this.$services.data.unwatchAll(this.subscriptions);
		},
		watchAll: function() {
			this.unsubscribe();
			var self = this;
			nabu.utils.arrays.merge(this.subscriptions, this.$services.data.watchAll({
				instance: this,
				target: this.cell.state,
				handler: function() {
					self.loadData();
					self.watchAll();
				}
			}));
		},
		loadData: function() {
			var self = this;
			self.clear();
			this.$services.data.load({
				instance: this,
				limit: 0,
				handler: function(results, page) {
					self.clear();
					results.sort(function(a, b) {
						return a.messageIndex - b.messageIndex;
					});
					results.forEach(self.play);
				}
			});
		},
		clear: function() {
			this.steps.splice(0);
		},
		play: function(message) {
			var current = this.getCurrentStep();
			var item = {
				message: message,
				steps: []
			};
			if (current) {
				// if we have a stop, it is stopping the current item
				if (message.stopped) {
					// merge all fields that do not exist in the stop message
					Object.keys(current.message).forEach(function(key) {
						if (message[key] == null) {
							message[key] = current.message[key];
						}
					});
					current.message = message;
				}
				else {
					current.steps.push(item);
				}
			}
			else {
				this.steps.push(item);
			}
		},
		getCurrentStep: function(steps) {
			if (!steps) {
				steps = this.steps;
			}
			// go reverse
			for (var i = steps.length - 1; i >= 0; i--) {
				// and go deep
				var childCurrent = this.getCurrentStep(steps[i].steps);
				if (childCurrent) {
					return childCurrent;
				}
				else if (steps[i].message.started && !steps[i].message.stopped) {
					return steps[i];
				}
			}
		}
	}
});

Vue.component("data-trace-data-step", {
	template: "#data-trace-data-step",
	props: {
		name: {
			type: String,
			required: true
		},
		value: {
			required: false
		}
	},
	computed: {
		keyIcon: function() {
			var root = application.configuration.root;
			if (this.$services.page.isObject(this.value)) {
				return root + "resources/trace/structure.gif"
			}
			else if (this.value == null) {
				return root + "resources/trace/string.gif"
			}
			else if (this.value instanceof Number || parseFloat(this.value) == this.value) {
				return root + "resources/trace/double.gif"
			}
			else if (this.value instanceof Boolean || this.value === true || this.value === false) {
				return root + "resources/trace/boolean.gif"
			}
			// assume string!
			else {
				return root + "resources/trace/string.gif"
			}
		}
	}
});

Vue.component("data-trace-viewer-configure", {
	template: "#data-trace-viewer-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	}
})

Vue.component("data-trace-viewer-step", {
	template: "#data-trace-viewer-step",
	props: {
		steps: {
			type: Array,
			required: true
		},
		message: {
			type: Object,
			required: true
		},
		// the parent message (if any)
		parent: {
			type: Object,
			required: false
		},
		showTime: {
			type: Boolean,
			default: false
		},
		showInvokeMapping: {
			type: Boolean,
			default: false
		},
		selected: {
			type: Object,
			required: false
		},
		search: {
			type: String,
			required: false
		}
	},
	data: function() {
		return  {
			open: false
		}
	},
	created: function() {
		// if we are created with a search parameter, match immediately
		if (this.search) {
			this.open = this.containsMatch(this.search);
		}	
	},
	watch: {
		search: function(newValue) {
			if (newValue) {
				this.open = this.containsMatch(newValue);
			}
		}
	},
	computed: {
		filteredSteps: function() {
			var self = this;
			// we filter out reports, if that is your only claim to fame we don't want to show it as openable
			return this.steps.filter(function(x) {
				return x.message.traceType != "REPORT";
			});
		},
		renderDetails: function() {
			if (!this.message) {
				return false;
			}
			// a report aimed at business
			if (this.message.traceType == "REPORT" && this.message.audience == 'business') {
				return false;
			}
			if (this.message.subType == "be.nabu.libs.services.vm.step.Invoke" || (this.message.subType == "be.nabu.libs.services.vm.step.Link" && this.parent && this.parent.subType == "be.nabu.libs.services.vm.step.Invoke")) {
				return this.showInvokeMapping;	
			}
			return true;
		},
		treeIcon: function() {
			if (this.filteredSteps.length > 0) {
				return this.open ? "minus-square" : "plus-square";
			}
			else {
				return "ellipsis-h";
			}
		},
		stepLabel: function() {
			if (this.message.traceType == "SERVICE") {
				return this.message.serviceId;	
			}
			else if (this.message.comment) {
				return this.message.comment;
			}
			else if (this.message.report && this.message.subType == "be.nabu.eai.module.tracer.TraceReportString") {
				return this.reportString;
			}
			else if (this.message.subType) {
				return this.message.subType.replace("be.nabu.libs.services.vm.step.", "");
			}
			else if (this.message.reportType) {
				return this.message.reportType;
			}
			else {
				return this.message.traceType;
			}
		},
		reportString: function() {
			return this.getReportString(this.message);
		},
		stepIcon: function() {
			var root = application.configuration.root;
			if (this.message.subType && this.message.subType.indexOf("be.nabu.libs.services.vm.step.") == 0) {
				var type = this.message.subType.substring("be.nabu.libs.services.vm.step.".length);
				return root + "resources/trace/" + type.toLowerCase() + ".png";
			}
			else if (this.message.traceType == "SERVICE") {
				return root + "resources/trace/invoke.png";
			}
		},
		stepType: function() {
			if (this.message.traceType == "SERVICE") {
				return "Service";
			}
			else if (this.message.subType && this.message.subType.indexOf("be.nabu.libs.services.vm.step.") == 0) {
				return this.message.subType.substring("be.nabu.libs.services.vm.step.".length);
			}
			else {
				return this.message.subType;
			}
		},
		// check if we have a description
		description: function() {
			var message = this.steps.filter(function(x) {
				return x.message.audience == 'business';
			})[0];
			return message ? message.message : null;
		},
		descriptionString: function() {
			var description = this.description;
			return description ? this.getReportString(description) : null;
		}
	},
	methods: {
		containsMatch: function(search, steps) {
			if (this.exactMatch(search)) {
				return true;
			}
			var self = this;
			if (!steps) {
				steps = this.steps;
			}
			return steps.filter(function(x) {
				if (self.isSearchMatch(x.message, search)) {
					return true;
				}
				// recurse...
				else if (x.steps) {
					return self.containsMatch(search, x.steps);
				}
			}).length > 0;
		},
		exactMatch: function(search) {
			// the current message has to match!
			return this.isSearchMatch(this.message, search);
		},
		expand: function() {
			this.open = true;
			var self = this;
			Vue.nextTick(function() {
				if (self.$refs.children) {
					self.$refs.children.forEach(function(x) {
						x.expand();
					})
				}
			});
		},
		getReportString: function(message) {
			if (message.report && message.subType == "be.nabu.eai.module.tracer.TraceReportString") {
				return JSON.parse(message.report).report;
			}
			return null;
		},
		isSearchMatch: function(message, search) {
			if (!search) {
				return false;
			}
			else {
				search = search.toLowerCase();
			}
			console.log("searching", message.traceType, message.serviceId, search);
			return message.comment && message.comment.toLowerCase().indexOf(search) >= 0
				|| message.error && message.error.toLowerCase().indexOf(search) >= 0
				|| (message.traceType == "SERVICE" && message.serviceId.toLowerCase().indexOf(search) >= 0)
				|| message.input && message.input.toLowerCase().indexOf(search) >= 0
				|| message.output && message.output.toLowerCase().indexOf(search) >= 0
				|| message.report && message.report.toLowerCase().indexOf(search) >= 0;
		},
		showData: function(data) {
			this.$emit("showData", data);
		},
		showInput: function(message) {
			this.$emit("showInput", message);
		},
		showOutput: function(message) {
			this.$emit("showOutput", message);
		},
		cleanupFrom: function(from) {
			if (from.match(/^result[\w]{32}\/.*/)) {
				from = from.substring(39);
			}
			return from;
		}
	}
})