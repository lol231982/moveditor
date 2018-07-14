'use strict';

/**
 * @ngdoc directive
 * @name moveditorApp.directive:navigator
 * @description
 * # navigator
 */
angular.module('moveditorApp')
    .directive('mvTimeline', [
        'TimelineService',
        '$document',
        'ContentService',
        'MvHelperService',
        'DragAndDropService',
        function (TimelineService, $document, ContentService, MvHelperService, DragAndDropService) {
        return {
            templateUrl: '/views/directives/mvTimeline.html',
            replace: true,
            restrict: 'AE',
            controller: 'MvTimelineCtrl',
            bindToController: true,
            controllerAs: 'TimelineCtrl',
            link: function ($scope, $element, $attrs, TimelineCtrl) {

                $scope.timelineService = TimelineService;
                $scope.contentService = ContentService;
                $scope.isCutActive = false;

                var self = this;
                this.dragShorten = false;
                this.dragOffset = 0;
                this.dragFreeSpaceStart = 0;
                this.dragFreeSpaceEnd = 1920;
                this.dragShortenOffset = 5;

                $scope.click = function (param) {
                    console.log('clicked with param:', param);
                };

                $scope.muteChunk = function () {
                    // ToDo: !== instead of !=. must be tested
                    if (TimelineCtrl.focus.key !== null) {
                        if (ContentService.getContentList()[$scope.timelineService.timelineList[TimelineCtrl.focus.type][TimelineCtrl.focus.key].objectListId].type != "image") {
                            $scope.timelineService.timelineList[TimelineCtrl.focus.type][TimelineCtrl.focus.key].mute = !$scope.timelineService.timelineList[TimelineCtrl.focus.type][TimelineCtrl.focus.key].mute;
                            $scope.timelineService.saveTimelineStep();
                        }
                    }
                };

                $scope.deleteChunk = function () {
                    // ToDo: !== instead of !=. must be tested
                    if (TimelineCtrl.focus != null) {
                        var index = $scope.timelineService.timelineList.indexOf($scope.timelineService.timelineList[TimelineCtrl.focus]);
                        if (index > -1) {
                            ContentService.contentList[$scope.timelineService.timelineList[TimelineCtrl.focus].objectListId].active--;
                            $scope.timelineService.timelineList.splice(index, 1);
                        }
                        MvHelperService.updatePreviewPlayerParameters($scope.timelineService.timelineList, $scope.timelineService.timelineList);
                        TimelineCtrl.focus = null;
                        $scope.timelineService.calculateTimelineWidth();

                        $scope.timelineService.saveTimelineStep();
                    }
                };

                $scope.zoomIn = function () {
                    $scope.timelineService.zoomIn();
                }

                $scope.zoomOut = function () {
                    $scope.timelineService.zoomOut();
                }

                $scope.zoomReset = function () {
                    $scope.timelineService.zoomReset();
                }

                $scope.tap = function($event) {
                    TimelineCtrl.tap($event);
                };

                $scope.chunkTap = function($event, key, type) {
                    if(!$scope.isCutActive) {
                        TimelineCtrl.setFocus(key, type);
                    }

                    if($scope.isCutActive && TimelineCtrl.focus === key) {
                        TimelineCtrl.cutChunk($event, key, $element.find('#timelineDropArea'));
                        $scope.isCutActive = false;
                    }

                    if($scope.isCutActive && TimelineCtrl.focus === null) {
                        $scope.isCutActive = false;
                    }
                };

                $scope.panStart = function ($event, timelineObjectKey) {
                    if(angular.element($event.target)[0].className === 'timeline-object__chunk timeline-object__chunk--video ng-scope') {
                        self.dragShorten = false;
                        TimelineCtrl.focus = timelineObjectKey;
                        self.initDragLimitValues($event, timelineObjectKey);
                    }
                };

                $scope.hammerPanMove = function ($event, timelineObjectKey) {
                    if(TimelineCtrl.focus === timelineObjectKey && !self.dragShorten && angular.element($event.target)[0].className === 'timeline-object__chunk timeline-object__chunk--video ng-scope') {
                        TimelineCtrl.deactivateShorten();
                        self.setTimelineObjectToPosition($event, timelineObjectKey);
                        MvHelperService.updatePreviewPlayerParameters($scope.timelineService.timelineList, $scope.timelineService.timelineList);
                    }
                };

                this.setTimelineObjectToPosition = function($event, timelineObjectKey) {
                    var chunk = angular.element($event.target);
                    var chunkLengthInPixel = ($scope.timelineService.timelineList[timelineObjectKey].end - $scope.timelineService.timelineList[timelineObjectKey].start) *
                        $scope.timelineService.pixelPerSeconds;
                    var dragPosition = $event.center.x - self.dragOffset;

                    // console.log('dragPosition', dragPosition, '$event.center.x', $event.center.x, '- self.dragOffset', self.dragOffset);
                    // console.log('self.dragFreeSpaceStart', self.dragFreeSpaceStart);
                    // console.log('self.dragFreeSpaceEnd', self.dragFreeSpaceEnd, '- chunkLengthInPixel', chunkLengthInPixel, '=', self.dragFreeSpaceEnd - chunkLengthInPixel);

                    if(dragPosition <= self.dragFreeSpaceStart) {
                        dragPosition = self.dragFreeSpaceStart;
                    }

                    if (dragPosition >= (self.dragFreeSpaceEnd - chunkLengthInPixel)) {
                        dragPosition = self.dragFreeSpaceEnd - chunkLengthInPixel;
                    }

                    chunk[0].style['left'] = dragPosition + 'px';
                    self.calculateChunkTimeFromPixelPosition(dragPosition, timelineObjectKey);
                };

                this.calculateChunkTimeFromPixelPosition = function (startPosition, timelineObjectKey) {
                    var chunkLength = $scope.timelineService.timelineList[timelineObjectKey].end - $scope.timelineService.timelineList[timelineObjectKey].start;

                    $scope.timelineService.timelineList[timelineObjectKey].start = self.quantizeDraggedTime(startPosition / $scope.timelineService.pixelPerSeconds);
                    $scope.timelineService.timelineList[timelineObjectKey].end = self.quantizeDraggedTime($scope.timelineService.timelineList[timelineObjectKey].start + chunkLength);
                };

                $scope.panEnd = function ($event, timelineObjectKey) {
                    if(TimelineCtrl.focus === timelineObjectKey && !self.dragShorten) {
                        self.dragOffset = 0;
                        $scope.timelineService.calculateTimelineWidth();
                        TimelineCtrl.activateShorten();

                        $scope.timelineService.saveTimelineStep();
                    }
                };

                $scope.swapWithPreviousObject = function () {
                    if(TimelineCtrl.focus !== null && angular.isDefined($scope.timelineService.timelineList[TimelineCtrl.focus - 1])) {
                        $scope.timelineService.swapChunkWithPreviousObject(TimelineCtrl.focus);
                        TimelineCtrl.focus--;
                    }
                };

                $scope.swapWithNextObject = function () {
                    if(TimelineCtrl.focus !== null && angular.isDefined($scope.timelineService.timelineList[TimelineCtrl.focus + 1])) {
                        $scope.timelineService.swapChunkWithNextObject(TimelineCtrl.focus);
                        TimelineCtrl.focus++;
                    }
                };

                this.initDragLimitValues = function ($event, timelineObjectKey) {
                    // console.log(angular.element($event.target));
                    self.initDragOffset($event.center.x, angular.element($event.target)[0].offsetLeft);

                    if(angular.isDefined($scope.timelineService.timelineList[timelineObjectKey - 1])) {
                        self.dragFreeSpaceStart = $scope.timelineService.timelineList[timelineObjectKey - 1].end * $scope.timelineService.pixelPerSeconds;
                    }
                    else {
                        self.dragFreeSpaceStart = 0;
                    }

                    if(angular.isDefined($scope.timelineService.timelineList[timelineObjectKey + 1])) {
                        self.dragFreeSpaceEnd = $scope.timelineService.timelineList[timelineObjectKey + 1].start * $scope.timelineService.pixelPerSeconds;
                    }
                    else {
                        self.dragFreeSpaceEnd = $scope.timelineService.timelineWidth;
                    }
                };

                this.initDragOffset = function (mousePosition, offsetLeft) {
                    // console.log('mousePosition', mousePosition, '- offsetLeft', offsetLeft, '=', mousePosition - offsetLeft);
                    this.dragOffset = mousePosition - offsetLeft;
                };

                this.quantizeDraggedTime = function (timevalue) {
                    return Math.round(timevalue * $scope.timelineService.timelineQuantization) / $scope.timelineService.timelineQuantization;
                };

                this.dragTimelineWidthGrow = function() {

                };

                this.dragTimelineScroll = function() {

                };

                $scope.dragStartShortenStart = function($event, timelineObjectKey) {
                    self.dragShorten = true;
                    DragAndDropService.setDropableElement($element.find('#timelineDropArea'));
                };

                $scope.dragStartShortenMove = function($event, timelineObjectKey) {
                    if(self.dragShorten) {
                        self.dragStartShortenTimelineObject($event, timelineObjectKey);
                    }
                };

                $scope.dragStartShortenEnd = function($event, timelineObjectKey) {
                    self.dragShorten = false;
                    $scope.timelineService.saveTimelineStep();
                };

                $scope.dragEndShortenStart = function($event, timelineObjectKey) {
                    self.dragShorten = true;
                    DragAndDropService.setDropableElement($element.find('#timelineDropArea'));
                };

                $scope.dragEndShortenMove = function($event, timelineObjectKey) {
                    if(self.dragShorten) {
                        self.setEndDragShortenObject($event, timelineObjectKey);
                    }
                };

                $scope.dragEndShortenEnd = function($event, timelineObjectKey) {
                    self.dragShorten = false;
                    MvHelperService.updatePreviewPlayerParameters($scope.timelineService.timelineList, $scope.timelineService.timelineList);
                    $scope.timelineService.saveTimelineStep();
                };

                this.dragStartShortenTimelineObject = function($event, timelineObjectKey) {
                    var dragDistant = ((($event.center.x + DragAndDropService.dropableElement.scrollLeft) - self.dragShortenOffset));

                    var position = $scope.timelineService.roundTime(dragDistant / $scope.timelineService.pixelPerSeconds);
                    var limitStart = $scope.timelineService.roundTime($scope.timelineService.timelineList[timelineObjectKey].start - $scope.timelineService.timelineList[timelineObjectKey].offset);
                    var limitEnd = $scope.timelineService.roundTime($scope.timelineService.timelineList[timelineObjectKey].end);
                    var chunkType = $scope.contentService.contentList[$scope.timelineService.timelineList[timelineObjectKey].objectListId].type;
                    if(position < limitStart && chunkType !== 'image') {
                        position = $scope.timelineService.roundTime(limitStart);
                    }

                    if(angular.isDefined($scope.timelineService.timelineList[timelineObjectKey - 1]) && position < $scope.timelineService.timelineList[timelineObjectKey - 1].end) {
                        position = $scope.timelineService.timelineList[timelineObjectKey - 1].end;
                    }

                    if(position > limitEnd - 0.1) {
                        position = $scope.timelineService.roundTime(limitEnd - 0.1);
                    }

                    $scope.timelineService.timelineList[timelineObjectKey].start = $scope.timelineService.roundTime(position);
                    $scope.timelineService.timelineList[timelineObjectKey].offset = $scope.timelineService.roundTime(position - limitStart);


                };

                this.setEndDragShortenObject = function($event, timelineObjectKey) {
                    var dragDistant = ((($event.center.x + DragAndDropService.dropableElement.scrollLeft) - self.dragShortenOffset));

                    var position = $scope.timelineService.roundTime(dragDistant / $scope.timelineService.pixelPerSeconds);
                    var limitStart = $scope.timelineService.roundTime($scope.timelineService.timelineList[timelineObjectKey].start);
                    var limitEnd = $scope.timelineService.roundTime((limitStart - $scope.timelineService.timelineList[timelineObjectKey].offset) + ContentService.contentList[$scope.timelineService.timelineList[timelineObjectKey].objectListId].length);
                    var chunkType = $scope.contentService.contentList[$scope.timelineService.timelineList[timelineObjectKey].objectListId].type;

                    if(position < limitStart + 0.1) {
                        position = $scope.timelineService.roundTime(limitStart + 0.1);
                    }

                    if(position > limitEnd  && chunkType !== 'image') {
                        position = $scope.timelineService.roundTime(limitEnd);
                    }

                    if(angular.isDefined($scope.timelineService.timelineList[timelineObjectKey + 1]) && position > $scope.timelineService.timelineList[timelineObjectKey + 1].start) {
                        position = $scope.timelineService.timelineList[timelineObjectKey + 1].start;
                    }

                    $scope.timelineService.timelineList[timelineObjectKey].end = $scope.timelineService.roundTime(position);
                };

                $scope.activateCuttingMode = function() {
                    $scope.isCutActive = !$scope.isCutActive;
                };

                $scope.undo = function() {
                    // console.log('undo', $scope.timelineService.savedStepsPointer, $scope.timelineService.savedSteps);
                    $scope.timelineService.undoTimelineAction();
                    TimelineCtrl.unsetFocusAll();
                };

                $scope.redo = function () {
                    // console.log('redo', $scope.timelineService.savedStepsPointer, $scope.timelineService.savedSteps);
                    $scope.timelineService.redoTimelineAction();
                    TimelineCtrl.unsetFocusAll();
                };

                TimelineCtrl.initTimelineElement($element.find('#timelineDropArea'));
            }
        };
    }]);
