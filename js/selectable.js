angular.module('ui.selectable', [])
.factory('selectable', [ function () {
  var _id = 'default'
  var _selected = {}

  function get(id){
    id = id || _id
    _selected[id] = _selected[id] || []
    return _selected[id]
  }

  function clear(id){
    id = id || _id
    _selected[id].length = 0

  }

  function set(array, id){
    id = id || _id
    clear(id)
    $.merge(_selected[id], array)
  }

  function select(item, id){
    id = id || _id
    _selected[id].push(item)
  }

  function unselect(item, id){
    if(item instanceof Object){
      item = item.id
    }
    id = id || _id
    var i = $.inArray(item, _selected[id])
    if(i != -1){
      _selected[id].splice(i, 1);  
    }
  }

  return {
    get: get,
    set: set,
    clear: clear,
    select: select,
    unselect: unselect,
  }

}])
.directive('pfSelectable', ['selectable', function(selectable) {
  return {
    restrict: 'EA',      
    scope: {
      selectableId: "@pfSelectable",
      items: '='
    },
    link: function (scope, element, attrs, ctrl) {
      var selector = attrs.selector || '.item'
      var selectedClass = attrs.selectedClass || 'selected'
      var shiftSelect = attrs.shiftSelect || true
      var cancel = attrs.cancel

      ctrl.setSelector(selector)
      ctrl.setSelectedClass(selectedClass)
      ctrl.setShiftSelect(shiftSelect)  
      

      element.dragToSelect({
        selectables: selector, 
        selectedClass: selectedClass,
        percentCovered: 1,
        autoScroll: 'vertical',
        selectOnMove: true,
        cancel: cancel, // not allowed to start drawing select box
        recursive: true,  // recursive cancel
        onRefresh: function(){
          scope.$apply(function(){

          })
        }
      })
    },
    controller: function($scope, $element, selectable){
      var _selectedClass = ''
      var _selector = ''
      var _shiftSelect = false
      var _prev

      $scope.selected = selectable.get($scope.selectableId)
      $scope.$watchCollection('selected', function(selected){
        if(selected.length == 0){
          unselectAll()
        }
        if(selected.length == $scope.items.length){
          selectAll()
        }
      })

      function selectAll() {
        $element.find(_selector).addClass(_selectedClass)
      }

      function unselectAll() {
        $element.find(_selector).removeClass(_selectedClass)
      }

      this.setShiftSelect = function(){
        _shiftSelect = true
      }
      this.getShiftSelect = function(){
        return _shiftSelect
      }

      this.setSelector = function (selector) {
        _selector = selector
      }
      this.getSelector = function () {
        return _selector
      }
      this.setSelectedClass = function (selectedClass) {
        _selectedClass = selectedClass
      }
      this.getSelectedClass = function () {
        return _selectedClass
      }

      this.shiftSelect = function(end){
        var elems = $(_selector, $element)
        if(_prev < end){
          for(var i = _prev; i < end + 1; i++){
            var el = elems.eq(i)
            if(!el.hasClass(_selectedClass)){
              el.addClass(_selectedClass)
            }
          }
        }
        if(_prev > end){
         for(var i = _prev; i > end - 1; i--){
            var el = elems.eq(i)
            if(!el.hasClass(_selectedClass)){
              el.addClass(_selectedClass)
            }
          } 
        }
      }

      this.select = function (item, index) {
        if(_shiftSelect){
          _prev = index
        }
        selectable.select(item, $scope.selectableId);        
      }

      this.unselect = function(item, index){
        if(_shiftSelect){
          _prev = index
        }
        selectable.unselect(item, $scope.selectableId)
      }
    }
  }
}])
.directive('pfSelect', function () {
  return {
    restrict: 'A',
    require: '^pfSelectable',
    link: function (scope, element, attrs, ctrl) {
      var item = scope.$eval(attrs.pfSelect)
      var selectedClass = ctrl.getSelectedClass()
      scope.$watch(function(){
        return element.hasClass(selectedClass)
      }, function(newValue){
        if(newValue){
          ctrl.select(item, scope.$index)
        }else{
          ctrl.unselect(item, scope.$index)
        }
      });

      element.bind('mousedown', function(e){
        if(e.ctrlkey){
          element.toggleClass(selectedClass) 
        }
      })
    }
  }
})
.directive('pfSelectByClick', function () {
  return {
    restrict: 'A',
    require: '^pfSelectable',
    link: function(scope, element, attrs, ctrl) {
      var item = scope.$eval(attrs.pfSelectByClick)
      var selectedClass = ctrl.getSelectedClass()
      var selector = ctrl.getSelector()
      var shiftSelect = ctrl.getShiftSelect()
      element.bind('click', function (e) {
        if(shiftSelect && e.shiftKey){
          scope.$apply(function(){
            ctrl.shiftSelect(scope.$index)
          })
        }else{
          scope.$apply(function(){
            element.closest(selector).toggleClass(selectedClass) 
          })
        }
      })
    }
  }
})