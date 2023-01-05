<template id="data-trace-viewer-step">
	<div class="data-trace-viewer-step" :class="['data-trace-viewer-step-' + message.traceType, {'is-openable': filteredSteps.length > 0}, {'is-rendered': renderDetails}]">
		<div class="step-content" v-if="renderDetails" :class="[{'is-selected': selected == message, 'is-match': search && exactMatch(search) }]" >
			<div class="step-content-container" @dblclick="expand" @click="function() { open = !open ? true : selected != message; $emit('select', message) }" @keypress.ctrl.e.prevent="expand" tabindex="-1">
				<icon :name="treeIcon" class="tree-icon is-size-xsmall is-color-light"/>
				<span class="is-tag is-size-xsmall" :class="{'is-color-danger-outline': message.error, 'is-color-success-outline': !message.error}" v-if="message.stopped">{{message.stopped.getTime() - message.started.getTime()}}ms</span>
				<span class="is-tag is-size-xsmall" v-else-if="message.started">...ms</span>
				<span class="timestamp is-size-xsmall" v-if="message.started && showTime">{{$services.formatter.date(message.started, 'HH:mm:ss')}}</span>
				<img class="step-icon" :src="stepIcon"/>
				<span class="step-label is-content is-size-xsmall type">{{stepLabel}}</span>
				<span class="is-tag is-size-xsmall" v-if="message.fromValue" :class="{'is-variant-secondary-outline': message.fixed, 'is-variant-primary-dark-outline': !message.fixed}">{{cleanupFrom(message.fromValue)}}</span>
				<icon class="is-size-xsmall" v-if="message.fromValue && message.toValue" name="arrow-right"/>
				<span class="is-tag is-size-xsmall is-variant-primary-dark-outline" v-if="message.toValue">{{message.toValue}}</span>
				<span class="is-tag is-size-xsmall is-color-danger" v-if="message.code && message.subType == 'be.nabu.libs.services.vm.step.Throw'">{{message.code}}</span>
				<span class="is-tag is-size-xsmall is-color-danger" v-if="message.reportType == 'exception-description' && message.report">{{message.report}}</span>
			</div>
			<div class="is-row is-position-right is-align-center is-wrap-none is-spacing-gap-xsmall">
				<ul class="is-menu is-variant-toolbar is-row is-align-center is-wrap-none">
					<li class="is-column" v-if="message.input"><button class="is-button is-size-xsmall is-variant-warning-outline" type="button" @click="showData(message.input)">Input</button></li>
					<li class="is-column" v-if="message.output"><button class="is-button is-size-xsmall is-variant-warning-outline" type="button" @click="showData(message.output)">Output</button></li>
					<li class="is-column" v-if="description && !descriptionString"><button class="is-button is-size-xsmall is-variant-warning-outline" type="button" @click="showData(description.report)">Description</button></li>
				</ul>
				<span v-if="message.traceType == 'SERVICE' && message.comment" class="is-tag is-size-xsmall">{{message.comment}}</span>
				<span v-if="descriptionString" class="is-tag is-size-xsmall is-variant-primary-dark-outline">{{descriptionString}}</span>
			</div>
		</div>
		<div v-if="filteredSteps.length">
			<data-trace-viewer-step v-for="step in steps" :steps="step.steps" :message="step.message" 
				v-show="open || !renderDetails"
				ref="children"
				v-bubble:showInput 
				v-bubble:showOutput
				v-bubble:showData
				v-bubble:select
				:show-time="showTime"
				:show-invoke-mapping="showInvokeMapping"
				:parent="message"
				:selected="selected"
				:search="search"/>
		</div>
	</div>
</template>

<template id="data-trace-data-step">
	<div class="data-trace-data-step">
		<template v-if="value instanceof Array">
			<data-trace-data-step
				v-for="(single, index) in value"
				:name="name + '[' + index + ']'"
				:value="single"/>
		</template>
		<template v-else>
			<div class="data-trace-data-record">
				<div class="data-trace-data-key">
					<img class="key-icon" :src="keyIcon"/>
					<span class="key-name is-content is-size-xsmall">{{name}}</span>
				</div>
				<div class="data-trace-data-value is-content is-size-xsmall is-null" v-if="value == null">null</div>
				<div class="data-trace-data-value" v-else-if="$services.page.isObject(value)">
					<data-trace-data-step
						v-for="(childValue, key) in value"
						:name="key"
						:value="childValue"/>
				</div>
				<div class="data-trace-data-value is-content is-size-xsmall" v-else>{{value}}</div>
			</div>
		</template>
	</div>
</template>

<template id="data-trace-viewer">
	<div class="is-trace-viewer">
		<div class="trace-steps">
			<n-form-text v-model="search" placeholder="Search" :timeout="300"/>
			<div v-if="steps.length">
				<data-trace-viewer-step 
					v-for="step in steps" 
					:steps="step.steps" 
					:message="step.message" 
					@showData="function(value) { $window.Vue.set($self, 'data', value ? $window.JSON.parse(value) : null); $window.console.log('showing', data); }"
					@select="function(value) { selected = value }"
					v-bubble:showInput 
					v-bubble:showOutput 
					:show-time="showTime"
					:show-invoke-mapping="showInvokeMapping"
					:selected="selected"
					:search="search"/>
			</div>
			<div class="is-trace-menu">
				<n-form-checkbox v-model="showTime" label="Show timestamp"/>
				<n-form-checkbox v-model="showInvokeMapping" label="Show invoke mappings"/>
			</div>
		</div>
		<div class="trace-data" v-if="data">
			<data-trace-data-step
				v-for="(childValue, key) in data"
				:name="key"
				:value="childValue"/>
		</div>
	</div>
</template>


<template id="data-trace-viewer-configure">
	<div class="data-trace-viewer-configure is-column is-spacing-medium">
		<data-configure :target="cell.state" :page="page"/>
	</div>
</template>