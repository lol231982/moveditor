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
                    if (TimelineCtrl.focus != null) {
                        if (ContentService.getContentList()[$scope.timelineService.timelineList[TimelineCtrl.focus].objectListId].type != "image") {
                            $scope.timelineService.timelineList[TimelineCtrl.focus].mute = !$scope.timelineService.timelineList[TimelineCtrl.focus].mute;
                        }
                    }
                };

                $scope.deleteChunk = function () {
                    if (TimelineCtrl.focus != null) {
                        var index = $scope.timelineService.timelineList.indexOf($scope.timelineService.timelineList[TimelineCtrl.focus]);
                        if (index > -1) {
                            $scope.timelineService.timelineList.splice(index, 1);
                        }
                        MvHelperService.updatePreviewPlayerParameters($scope.timelineService.timelineList, $scope.timelineService.timelineList);
                        TimelineCtrl.focus = null;
                    }
                };

                $scope.tap = function($event) {
                    TimelineCtrl.tap($event);
                };

                $scope.panStart = function ($event, timelineObjectKey) {
                    self.dragShorten = false;
                    if(TimelineCtrl.focus === timelineObjectKey) {
                        self.initDragLimitValues($event, timelineObjectKey);
                    }
                };

                $scope.hammerPanMove = function ($event, timelineObjectKey) {
                    if(TimelineCtrl.focus === timelineObjectKey && !self.dragShorten) {
                        var timelineObjectLength = ($scope.timelineService.timelineList[timelineObjectKey].end - $scope.timelineService.timelineList[timelineObjectKey].start) *
                            $scope.timelineService.pixelPerSeconds;
                        TimelineCtrl.deactivateShorten();

                        if ($event.center.x - self.dragOffset >= self.dragFreeSpaceStart &&
                            ($event.center.x - self.dragOffset + timelineObjectLength) <= self.dragFreeSpaceEnd) {
                            self.dragTimelineObject($event, timelineObjectKey);
                            MvHelperService.updatePreviewPlayerParameters($scope.timelineService.timelineList, $scope.timelineService.timelineList);
                        }
                    }
                };

                $scope.panEnd = function ($event, timelineObjectKey) {
                    if(TimelineCtrl.focus === timelineObjectKey && !self.dragShorten) {
                        self.dragOffset = 0;
                        $scope.timelineService.calculateTimelineWidth();
                        TimelineCtrl.activateShorten();
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

                this.dragTimelineObject = function($event, timelineObjectKey) {
                    var chunk = angular.element($event.target);
                    chunk[0].style['left'] = ($event.center.x - self.dragOffset) + 'px';

                    var chunkLength = $scope.timelineService.timelineList[timelineObjectKey].end - $scope.timelineService.timelineList[timelineObjectKey].start;
                    $scope.timelineService.timelineList[timelineObjectKey].start = self.quantizeDraggedTime(
                        ($event.center.x - self.dragOffset) / $scope.timelineService.pixelPerSeconds);
                    $scope.timelineService.timelineList[timelineObjectKey].end = self.quantizeDraggedTime(
                        $scope.timelineService.timelineList[timelineObjectKey].start + chunkLength);
                };

                this.initDragLimitValues = function ($event, timelineObjectKey) {
                    self.dragOffset = $event.center.x - angular.element($event.target)[0].offsetLeft;

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
                };

                this.dragStartShortenTimelineObject = function($event, timelineObjectKey) {
                    var dragDistant = ((($event.center.x + DragAndDropService.dropableElement.scrollLeft) - self.dragShortenOffset));

                    var position = $scope.timelineService.roundTime(dragDistant / $scope.timelineService.pixelPerSeconds);
                    var limitStart = $scope.timelineService.roundTime($scope.timelineService.timelineList[timelineObjectKey].start - $scope.timelineService.timelineList[timelineObjectKey].offset);
                    var limitEnd = $scope.timelineService.roundTime(limitStart + ContentService.contentList[$scope.timelineService.timelineList[timelineObjectKey].objectListId].length);

                    if(position < limitStart) {
                        position = $scope.timelineService.roundTime(limitStart);
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
                    var limitStart = $scope.timelineService.roundTime($scope.timelineService.timelineList[timelineObjectKey].start - $scope.timelineService.timelineList[timelineObjectKey].offset);
                    var limitEnd = $scope.timelineService.roundTime(limitStart + ContentService.contentList[$scope.timelineService.timelineList[timelineObjectKey].objectListId].length);

                    if(position < limitStart + 0.1) {
                        position = $scope.timelineService.roundTime(limitStart + 0.1);
                    }

                    if(position > limitEnd) {
                        position = $scope.timelineService.roundTime(limitEnd);
                    }

                    $scope.timelineService.timelineList[timelineObjectKey].end = $scope.timelineService.roundTime(position);
                };

                TimelineCtrl.initTimelineElement($element.find('#timelineDropArea'));
            }
        };
    }]);
