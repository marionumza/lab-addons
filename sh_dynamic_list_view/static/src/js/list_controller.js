odoo.define('sh_dynamic_list_view.ListController', function (require) {
"use strict";

var ListController = require('web.ListController');
var ListRenderer = require('web.ListRenderer');
var BasicView = require('web.BasicView');
var ListView = require('web.ListView');

var BasicModel = require('web.BasicModel');
var core = require('web.core');
var _t = core._t;
var QWeb = core.qweb;
var rpc= require("web.rpc");
var session = require('web.session');
var AbstractView = require('web.AbstractView');
var FieldUtil = require('web.field_utils');
var can_hide_show_custom_field = false
var time = require('web.time');

var config = require('web.config');



var pyUtils = require('web.py_utils');

var allModelfieldNames = {}
rpc.query({
  model: 'sh.model.field',
  method: 'search_read',
  args: [
      [
        ['sh_invisible','=',false]
      ],
      []
  ],
})
.then(function(res) {
	if(res.length > 0){
		 _.each(res, function (value, key) {
			 if(value['sh_attrs_model'] in allModelfieldNames){
				 var temp_list = allModelfieldNames[value['sh_attrs_model']]
				 temp_list.push(value['sh_attrs_name'])
				 allModelfieldNames[value['sh_attrs_model']] = temp_list
			 }else{
				 allModelfieldNames[value['sh_attrs_model']] = [value['sh_attrs_name']]
			 }
		 });
	}
	
});


BasicModel.include({
	
	
	  _parseServerData: function (fieldNames, element, data) {
		  
	        var self = this;
	        if(element.viewType == 'list'){
		        _.each(allModelfieldNames[element.model], function (field_name) {
		        	 if(jQuery.inArray(field_name,fieldNames) == -1){
		        		 fieldNames.push(field_name)
		        	 }
		        });
	        }
	        _.each(fieldNames, function (fieldName) {
	            var field = element.fields[fieldName];
	            var val = data[fieldName];
	            if (field.type === 'many2one') {
	                // process many2one: split [id, nameget] and create corresponding record
	                if (val !== false && val !== undefined) {
	                    // the many2one value is of the form [id, display_name]
	                    var r = self._makeDataPoint({
	                        modelName: field.relation,
	                        fields: {
	                            display_name: {type: 'char'},
	                            id: {type: 'integer'},
	                        },
	                        data: {
	                            display_name: val[1],
	                            id: val[0],
	                        },
	                        parentID: element.id,
	                    });
	                    data[fieldName] = r.id;
	                } else {
	                    // no value for the many2one
	                    data[fieldName] = false;
	                }
	            } else {
	                data[fieldName] = self._parseServerValue(field, val);
	            }
	        });
	    
	    },
	    
	    
	 
});


ListController.include({
		
		 init: function (parent, model, renderer, params) {
			this._super.apply(this, arguments);
		        var self = this;


				session.user_has_group('sh_dynamic_list_view.group_global_custom_field_list').then(function(has_group) {
					self.can_hide_show_custom_field = has_group
				});
		 },

		   renderButtons: function ($node) {
			   
			   this._super.apply(this, arguments);
			  
			   var self = this;
			   if(this.$buttons){
				   this.$buttons.on('click', '.sh_field_list', this._onSelectField.bind(this));
		            this.$buttons.on('click', '.close_button', this._onCloseWidget.bind(this));
		            this.$buttons.on('click', '.apply_button', this._onApplyWidget.bind(this));
		            this.$buttons.appendTo($node);
			   }
	           
	            
		    },
		    _onSelectField: function (event) {
		    	
		    	  var self = this;
		    	  var field_list = []
		    	  	this.renderer.arch.children.sort(function(a, b) {
		    		  return a.sequence - b.sequence;
		    		}); 
				   _.each(this.renderer.arch.children, function(node) {
		                var name = node.attrs.name
		                if(node.attrs.string || self.renderer.state.fields[name]){
		                	 var description = node.attrs.string || self.renderer.state.fields[name].string;
				                field_list.push({
				                    'name': node.attrs.name,
				                    'label': description,
				                    'column_invisible': node.attrs.modifiers.column_invisible || false
				                })
		                }
		               
		            }) 
		    		  
		    	this.$buttons.find('.field_list').html(QWeb.render('SelectFieldWidget', {widget: this,field_list:field_list}));
		    	  this.$buttons.find('.field_list').find('#sortable').sortable();
		    	this.$buttons.find('.field_ul').show();
		    },
		    _onCloseWidget: function(ev){
		    	 ev.stopPropagation(); 
		    	 this.$buttons.find('.field_ul').hide();
		    	
		    },
		    _onApplyWidget: function(event){
		    	event.stopPropagation();
		    	 var self = this;
		    	 var selection_field_li = this.$buttons.find('.field_li')
		    	 var checkbox_list = []
		    	 var viewID = false;
		    	 var sequence = 1;
		    	_.each(selection_field_li, function(each_li) {
		    		
		    		 var checkbox = $(each_li).find('input[type=checkbox]');
		    		 var field_text = $(each_li).find('input[type=text]');
		    		 if (checkbox.prop('checked')) {
		    			 checkbox_list.push(checkbox.data('name'))
		    		 }

		    		 var field = _.find(self.renderer.arch.children, function(field) {
		                 return field.attrs.name === checkbox.data('name')
		             });
		    		 var sh_invisible = true;
		    		 if (checkbox.prop('checked')) {
		                 field.attrs.modifiers.column_invisible = false;
		                 sh_invisible = false
		                 
		             } else {
		                 field.attrs.modifiers.column_invisible = true;
		                 sh_invisible = true
		             }
		    		 field.attrs.string = field_text.val()
		    		
		    		 
		    		 var model = self.renderer.state.model
		    		 rpc.query({
		                    model: 'sh.model.field',
		                    method: 'search_read',
		                    args: [
		                        [
		                            ['sh_attrs_model', '=', model],
		                            ['sh_attrs_name', '=', checkbox.data('name')]
		                        ],
		                        ['sh_invisible','sh_attrs_name','sh_attrs_label','sh_sequence']
		                    ],
		                })
		                .then(function(res) {
		                	if(res.length>0){
		                		self._rpc({
				                    model: "sh.model.field",
				                    method: "write",
				                    args: [res[0]['id'], {'sh_invisible': sh_invisible,
				                    	'sh_attrs_label':field_text.val(),
				                    	'sh_sequence':sequence}],
				                    	
				                })

				                field.sequence = sequence
				                sequence = sequence+1;
		                	}
//		                	location.reload();
		                });
		    		 
		         });
		   
		    	 self.renderer.arch.children.sort(function(a, b) {
		    		  return a.sequence - b.sequence;
		    		}); 
		    	

		    	 this.renderer.updateState(this.model.get(this.handle), {reload: true})
		    	 this.$buttons.find('.field_ul').hide();
		    	 
		    },
	});


ListView.include({
	
		_processFieldsView: function (fieldsView, viewType) {
	        var fv = this._super.apply(this, arguments);

	        viewType = viewType || this.viewType;
	        fv.type = viewType;
	        fv.fieldsInfo = Object.create(null);
	        fv.fieldsInfo[viewType] = Object.create(null);
	        var self = this;
	        this._processArch(fv.arch, fv);
	       
	        if(fv.type =='list'){
	        	var field_type_array = ['boolean','selection','char','integer','float','many2one','date','datetime','monetary']
	        	 var arch_field_list = []
		    	  _.each(fv.fields, function(field_key,value) {
		    		  if(field_type_array.includes(field_key.type)){
		    			  var field_exist = false;
		    			 
		    			  
			    		  _.each(fv.arch.children, function(field,key) {
			    			  if(value == field.attrs['name']){
			    				  field_exist = true
			    				  if(field['attrs']['invisible']){
			    					  field['attrs']['invisible']= 0
			    				  }
			    				  if(field['attrs']['modifiers']){
			    					  
			    					  
			    					  
			    					  rpc.query({
				  		                    model: 'sh.model.field',
				  		                    method: 'search_read',
				  		                    args: [
				  		                        [
				  		                            ['sh_attrs_model', '=', fv.model],
				  		                            ['sh_attrs_name', '=', value]
				  		                        ],
				  		                        ['sh_invisible','sh_attrs_label','sh_sequence']
				  		                    ],
				  		                })
				  		                .then(function(res) {
				  		                	if(res.length>0){
				  		                		field['attrs']['modifiers']['column_invisible'] = res[0]['sh_invisible']
				  		                		field['attrs']['string'] = res[0]['sh_attrs_label']
				  		                		field['sequence']= res[0]['sh_sequence'];
				  		                	}else{
				  		                	// create record
				  	    					  rpc.query({
				  		 		                    model: "sh.model.field",
				  		 		                    method: "create",
				  		 		                    args: [{'sh_attrs_model':fv.model, 'sh_attrs_name':value,
				  		 		                    	'sh_attrs_label':field_key['string'] || value,
				  		 		                    	'sh_invisible': false}],
				  		 		                })
				  		                	}
				  		                });
			    					  
			    					  
			    				  }
			    				  
			    			  }
			    		  });
			    		  if(field_exist == false){
			    			  
			    			
			    			rpc.query({
	  		                    model: 'sh.model.field',
	  		                    method: 'search_read',
	  		                    args: [
	  		                        [
	  		                            ['sh_attrs_model', '=', fv.model],
	  		                            ['sh_attrs_name', '=', value]
	  		                        ],
	  		                        ['sh_invisible','sh_attrs_name','sh_attrs_model','sh_attrs_label','sh_sequence']
	  		                    ],
	  		                })
	  		                .then(function(res) {
	  		                	
		              			var field_data = {}
						  		field_data['tag']= 'field';
		              			
						  		var attrs_data = {}
						  		attrs_data['name'] = value
						  		
						  		attrs_data['invisible'] = 0
						  		
						  		
			    				  if(res.length>0){
			    					  attrs_data['string'] = res[0]['sh_attrs_label']
			    					  attrs_data['modifiers'] = {'column_invisible':res[0]['sh_invisible']}
			    					  field_data['sequence']= res[0]['sh_sequence'];
			    				  }else{
			    					  attrs_data['modifiers'] = {'column_invisible':true}
			    					  
			    					  // create record
			    					  rpc.query({
				 		                    model: "sh.model.field",
				 		                    method: "create",
				 		                    args: [{'sh_attrs_model':fv.model, 'sh_attrs_name':value,
				 		                    	'sh_attrs_label':field_key['string'] || value,
				 		                    	'sh_invisible': true}],
				 		                })
			    				  }
						  		
						  		field_data['attrs'] = attrs_data;
						  		
						  		field_data['children']= [];
						  		
						  		fv.arch.children.push(field_data)
						  		fv.arch.children.sort(function(a, b) {
						    		  return a.sequence - b.sequence;
						    		});
			    				  
			    			  }); 

						  		
						  		
			    		  }else{
			    			  
			    			
			    		  }
		    		  }
		    		  
		    		  
			    	});
	        	

	        	
	        }
	        

	        return fv;
	    },
	    
	});
ListRenderer.include({
	 _renderHeaderCell: function (node) { 
	        const { icon, name, string } = node.attrs;
	        var order = this.state.orderedBy;
	        var isNodeSorted = order[0] && order[0].name === name;
	        var field = this.state.fields[name];
	        var $th = $('<th>');
	        if (name) {
	            $th.attr('data-name', name);
	        } else if (string) {
	            $th.attr('data-string', string);
	        } else if (icon) {
	            $th.attr('data-icon', icon);
	        }
	        if (node.attrs.editOnly) {
	            $th.addClass('oe_edit_only');
	        }
	        if (node.attrs.readOnly) {
	            $th.addClass('oe_read_only');
	        }
	        if (node.tag === 'button_group') {
	            $th.addClass('o_list_button');
	        }
	        if (!field || node.attrs.nolabel === '1') {
	            return $th;
	        }
	        var description = string || field.string;
	        if (node.attrs.widget) {
	            $th.addClass(' o_' + node.attrs.widget + '_cell');
	            const FieldWidget = this.state.fieldsInfo.list[name].Widget;
	            if (FieldWidget.prototype.noLabel) {
	                description = '';
	            } else if (FieldWidget.prototype.label) {
	                description = FieldWidget.prototype.label;
	            }
	        }
	        if( this.state.fieldsInfo.list[name]){
	        	   $th.text(description)
		            .attr('tabindex', -1)
		            .toggleClass('o-sort-down', isNodeSorted ? !order[0].asc : false)
		            .toggleClass('o-sort-up', isNodeSorted ? order[0].asc : false)
		            .addClass((field.sortable || this.state.fieldsInfo.list[name].options.allow_order || false) && 'o_column_sortable');

	        }else{
	        	
	        	$th.text(description)
	            .attr('tabindex', -1)
	            .toggleClass('o-sort-down', isNodeSorted ? !order[0].asc : false)
	            .toggleClass('o-sort-up', isNodeSorted ? order[0].asc : false);

	        }
	     
	        if (isNodeSorted) {
	            $th.attr('aria-sort', order[0].asc ? 'ascending' : 'descending');
	        }

	        if (field.type === 'float' || field.type === 'integer' || field.type === 'monetary') {
	            $th.addClass('o_list_number_th');
	        }

	        if (config.isDebug()) {
	            var fieldDescr = {
	                field: field,
	                name: name,
	                string: description || name,
	                record: this.state,
	                attrs: _.extend({}, node.attrs, this.state.fieldsInfo.list[name]),
	            };
	            this._addFieldTooltip(fieldDescr, $th);
	        } else {
	            $th.attr('title', description);
	        }
	        return $th;
	    },
});
function MyCustomformatDate(value, field, options) {
	    if (value === false) {
	        return "";
	    }
	    if(typeof(value) != 'string' && typeof(value) != 'undefined'){
	    	if (field && field.type === 'datetime') {
	            if (!options || !('timezone' in options) || options.timezone) {
	                value = value.clone().add(session.getTZOffset(value), 'minutes');
	            }
	        }
	        var date_format = time.getLangDateFormat();
	        return value.format(date_format);
	    }else{
	    	return value
	    }
	    
}
function MyCustomformatDateTime(value, field, options) {
	if (value === false) {
        return "";
    }
	if(typeof(value) != 'string' && typeof(value) != 'undefined'){
	    if (!options || !('timezone' in options) || options.timezone) {
	        value = value.clone().add(session.getTZOffset(value), 'minutes');
	    }
	    return value.format(time.getLangDatetimeFormat());
	}else{
    	return value
    }
}
FieldUtil.format.date = MyCustomformatDate;
FieldUtil.format.datetime = MyCustomformatDateTime;
	
});
