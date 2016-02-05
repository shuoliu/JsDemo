function MyEventWidget(params) {
    if (! this instanceof MyEventWidget) {
        return new MyEventWidget(renderParams);
    }

    this.widget = null;
    this.events = [];
    this.current = -1;
    this.scrolling = false;
    this.bubble = null;

    this.defaultParams = {
        cellHeight: 60,
        displayCount: 2,
        scrollCount: 1
    };

    this.renderParams = JSON.parse(JSON.stringify(this.defaultParams));

    if (params && (typeof params == 'object')) {
        for(var key in params) {
            if (this.renderParams[key]) {
                this.renderParams[key] = params[key];
            }
        }
    }
    
    var widgetCount = document.getElementsByClassName('event-widget-wrapper').length;
    this.renderParams['widgetId'] = 'event-widget-' + (widgetCount + 1);


    this.templateStore = this._initTemplateStore(this.renderParams);
}

MyEventWidget.prototype._initTemplateStore = function(renderParams) {
    var cellHeight = renderParams.cellHeight;
    var dateHeight = (cellHeight / 4) >> 0;
    var cellPadding = (dateHeight / 2) >> 0;
    var titleHeight = cellHeight - dateHeight - cellPadding;
    var eventCount = renderParams.displayCount;

    return {
        getWidgetTpl: function() {
            var html =  '<div class="event-widget-wrapper" id="' + renderParams.widgetId + '">' +
                            '<div class="event-scroll-up"><div class="arrow-up"><<</div></div>' +
                            '<div class="event-list-wrapper" style="height: ' + (eventCount * cellHeight - 1) + 'px; overflow:hidden"></div>' +
                            '<div class="event-scroll-down"><div class="arrow-down">>></div></div>' +
                        '</div>';
            return html;
        },
        getEventBubbleTpl: function(event, cellWidth, showOnLeft) {
            var offset = (25 + cellWidth) + "px";
            var position = (showOnLeft ? "right: " : "left: ") + offset;
            var classNames = "event-detail event-detail-";
            classNames += showOnLeft ? "left" : "right";
            var html =  '<div class="' + classNames + '" style="' + position + '">' + 
                            '<p class="event-occasion">' + event.occasion + '</p>' +
                            '<div class="event-invitation" style="font-size: 10px; margin-bottom: 2px">' + 
                                'Invitation:' + event.invited_count + 
                            '</div>' +
                        '</div>';
            return html;
        },
        getEmptyEventTpl: function() {
            var height = cellHeight - 1;
            var divideLine = '<div class="event-divider" style="height: 1px"></div>';
            var html =  '<li class="event-cell event-empty-cell" style="height: ' + cellHeight + 'px">' +
                            '<div style="height: ' + height + 'px; line-height: ' + height + 'px">No upcoming event.</div>' + divideLine +
                        '</li>';
            return html;
        },
        getEventListTpl: function() {
            var html =  '<ul class="event-list"></ul>';
            return html;
        },
        getEventTpl: function(event, isPast, index) {
            var classNames = 'event-cell';
            if (isPast) classNames += ' event-past';
            var divideLine = '<div class="event-divider" style="height:1px; margin-top:' + (cellPadding - 1) + 'px"></div>';
            var date = event.month + '/' + event.day + '/' + event.year;
            var html =  '<li event-id="' + index + '" class="' + classNames + '" style="height: ' + cellHeight + 'px" title="' + event.occasion + '">' +
                            '<div class="event-name" style="height: ' + titleHeight + 'px; line-height: ' + titleHeight + 'px">' + 
                                event.occasion + 
                            '</div>' +
                            '<div class="event-date" style="height: ' + dateHeight + 'px">' + 
                                date +
                            '</div>' + divideLine +
                        '</li>';
            return html;
        }
    }
};

MyEventWidget.prototype._createElement = function(html) {
    var temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.firstChild;
};

MyEventWidget.prototype._getEventWrapper = function() {
    return this.widget.querySelector('.event-list-wrapper');
};

MyEventWidget.prototype._getEventList = function() {
    return this.widget.querySelector('.event-list');
};

MyEventWidget.prototype._sortEvents = function() {
    this.events.sort(function(a, b) {
        if (a.year != b.year) return a.year - b.year;
        if (a.month != b.month) return a.month - b.month;
        return a.day - b.day;
    });
};

MyEventWidget.prototype._isEventPast = function(event) {
    var date = new Date();
    if (date.getFullYear() != event.year) return date.getFullYear() > event.year;
    if (date.getMonth() + 1 != event.month) return date.getMonth() + 1 > event.month;
    return date.getDate() > event.day;
};

MyEventWidget.prototype._showEventBubble = function(element) {
    var index = element.getAttribute('event-id');
    if (index == null) return;
    index = parseInt(index);

    var elementRect = element.getBoundingClientRect();
    var left = elementRect.left;
    var windowWidth = isNaN(window.innerWidth) ? window.clientWidth : window.innerWidth;
    var right = windowWidth - elementRect.right;
    var width = elementRect.width;
    var elBubble = this._createElement(this.templateStore.getEventBubbleTpl(this.events[index], width, left > right));
    elBubble.style.visibility = 'hidden';
    this._getEventWrapper().appendChild(elBubble);

    var bubbleHeight = elBubble.getBoundingClientRect().height;
    var cellHeight = this.renderParams.cellHeight;
    var top = 20 + (index - this.current) * cellHeight + (((cellHeight - bubbleHeight) / 2) >> 0);
    elBubble.style.top = top + 'px';
    var triangleTop = ((bubbleHeight / 2) >> 0) - 14;

    var style = document.createElement("style"); 
    elBubble.appendChild(style);
    style.sheet.insertRule('#' + this.renderParams.widgetId + ' .event-detail::before {top: ' + triangleTop + 'px}', 0);
    style.sheet.insertRule('#' + this.renderParams.widgetId + ' .event-detail::after {top: ' + triangleTop + 'px}', 0);
    elBubble.style.visibility = null;


    this.bubble = elBubble;
};

MyEventWidget.prototype._assembleEventCells = function(fromIndex, count) {
    var eventList = [];
    for (var j = count - 1; j >= 0; j--, fromIndex++) {
        if (fromIndex < this.events.length) {
            eventList.push(this.templateStore.getEventTpl(this.events[fromIndex], 
                            this._isEventPast(this.events[fromIndex]), fromIndex));
        } else {
            eventList.push(this.templateStore.getEmptyEventTpl());
        }
    }
    return eventList.join('');
};

MyEventWidget.prototype._eventScrollUp = function() {
    var that = this;
    var scrollCount = Math.min(this.renderParams.scrollCount, this.current);
    if (scrollCount == 0) return;
    this.scrolling = true;
    var elEventList = this._getEventList();
    var newEvents = this._assembleEventCells(this.current - scrollCount, scrollCount);
    elEventList.innerHTML = newEvents + elEventList.innerHTML;
    var margin = scrollCount * this.renderParams.cellHeight * -1;
    elEventList.style.marginTop = margin + "px";
    setTimeout(function() {
        elEventList.style.transition = "margin-top 0.5s ease";
        elEventList.style.marginTop = null;
        setTimeout(function() {
            elEventList.style.transition = null;
            for (var i = that.renderParams.displayCount + scrollCount - 1, j = that.renderParams.displayCount - 1; i > j; i --) {
                elEventList.removeChild(elEventList.childNodes[i]);
            }
            that.scrolling = false;
        }, 510);
    }, 10);
    this.current -= scrollCount;
};

MyEventWidget.prototype._eventScrollDown = function(e) {
    var that = this;
    var scrollCount = Math.min(this.renderParams.scrollCount, this.events.length - this.current);
    if (scrollCount == 0) return;
    this.scrolling = true;
    var elEventList = this._getEventList();
    var newEvents = this._assembleEventCells(this.current + this.renderParams.displayCount, scrollCount);
    elEventList.innerHTML += newEvents;
    elEventList.style.transition = "margin-top 0.5s ease";
    var margin = scrollCount * this.renderParams.cellHeight * -1;
    elEventList.style.marginTop = margin + "px";
    setTimeout(function() {
        elEventList.style.transition = null;
        for (var i = 0; i < scrollCount; i ++) {
            margin += that.renderParams.cellHeight;
            elEventList.removeChild(elEventList.childNodes[0]);
            elEventList.style.marginTop = margin + "px";
        }
        elEventList.style.marginTop = null;
        that.scrolling = false;
    }, 510);
    this.current += scrollCount;
};

MyEventWidget.prototype.init = function(params) {
    var that = this;
    this.events = (params.events || []).slice(0);
    this._sortEvents();
    this.redraw();

    var buttonUp = this.widget.querySelector('.event-scroll-up');
    var buttonDown = this.widget.querySelector('.event-scroll-down');

    buttonUp.addEventListener('click', function(e) {
        if (that.scrolling) return;
        that._eventScrollUp()
    });
    buttonDown.addEventListener('click', function(e) {
        if (that.scrolling) return;
        that._eventScrollDown();
    });

    buttonUp.addEventListener('mousedown', function(e) {
        this.classList.add('event-scroll-mousedown');
    });
    buttonDown.addEventListener('mousedown', function(e) {
        this.classList.add('event-scroll-mousedown');
    });

    buttonUp.addEventListener('mouseup', function(e) {
        this.classList.remove('event-scroll-mousedown');
    });
    buttonDown.addEventListener('mouseup', function(e) {
        this.classList.remove('event-scroll-mousedown');
    });

    this._getEventWrapper().addEventListener('click', function(e) {
        if (that.bubble) {
            that._getEventWrapper().removeChild(that.bubble);
            that.bubble = null;
        }

        var target = e.target;
        while (target.nodeName != 'LI') {
            target = target.parentNode;
        }
        that._showEventBubble(target);
    });
    this._getEventWrapper().addEventListener('mouseleave', function(e) {
        if (that.bubble) {
            that._getEventWrapper().removeChild(that.bubble);
            that.bubble = null;
        }
    });
};

MyEventWidget.prototype.redraw = function() {
    if (!this.widget) {
        this.widget = this._createElement(this.templateStore.getWidgetTpl());
        document.body.appendChild(this.widget);
    }
    var listWrapper = this._getEventWrapper();
    listWrapper.innerHTML = null;
    this.current = -1;
    var i;
    for (i = 0; i < this.events.length; i++) {
        this.current ++;
        if (!this._isEventPast(this.events[i])) break;
    }
    var elList = this._createElement(this.templateStore.getEventListTpl());
    elList.innerHTML = this._assembleEventCells(i, this.renderParams.displayCount);
    listWrapper.appendChild(elList);
};

MyEventWidget.prototype.addEvent = function(event) {
    this.events.push(event);
    this._sortEvents();
    this.redraw();
};