var UIController = (function(){

    
    var DOMStrings = {
        left: '.left',
        type_btn:  '.left__type',
        value_btn: '.left__value',
        add_btn: '.left__add',
        refresh_btn: '.left__refresh',
        board: 'board',
        itemContainer: '.item__list',
        item: '.item'
    };
    
    return {

        getInput: function(){
            var value = parseFloat(document.querySelector(DOMStrings.value_btn).value);
            if (value){
                if (value < 0) {
                    alert("Type an absolute value of charge");
                    document.querySelector(DOMStrings.value_btn).focus();
                }
                else return {
                type : document.querySelector(DOMStrings.type_btn).value,
                charge : value
                }
            }
            else {
                alert("Type a value of charge");
                document.querySelector(DOMStrings.value_btn).focus();
            }
        },
        
        getDOMStrings: function() {
            return DOMStrings;
        },
        
        addListItem: function(item){
            var html,description;
            
            html = '<div class="item clearfix" id="item-%id%"><div class="item__id">%no%</div><div class="item__description">%description%</div><div class="item__xcoord">%x%</div><div class="item__ycoord">%y%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            newHtml = html.replace('%id%',item.id)
                          .replace('%no%',item.id)
                          .replace('%x%',item.xcoord)
                          .replace('%y%',item.ycoord)
                          .replace('%description%',item.type)
                          .replace('%value%',item.value);
            
            document.querySelector(DOMStrings.itemContainer).insertAdjacentHTML('beforeend',newHtml);
        },
        
        deleteListItems: function(){
            document.querySelector(DOMStrings.itemContainer).innerHTML = "";
        },
        
        deleteListItem: function(selectorID){
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        }
    }
})();

var CanvasController = (function(){
    var DotsDensity = 15;
    var canvas = document.getElementById('board');
    var ctx = canvas.getContext("2d");

    var Item = function(id,type,value){
        this.id = id;
        this.type = type;
        this.value = value;
        this.xcoord = 0;
        this.ycoord = 0;
    };
    var Dot = function(x_dist,y_dist,leng,deactivate,potential){
        this.x_dist = x_dist;
        this.y_dist = y_dist;
        this.leng = leng;
        this.deactivate = deactivate;
        this.potential = potential;
    }

    var data = {
        allItems: [],
        maxValue: 0,
        maxPotential: 0,
        currentItem: null,
        dots: null,
        selectedItem: false,
        width: 0,
        height: 0,
        density: DotsDensity
    };
    
    
    var drawItem = function(item){
        ctx.beginPath();
        ctx.arc(item.xcoord,item.ycoord,15,0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(item.xcoord-7,item.ycoord-1,14,2);
        if (item.type === "pos"){
            ctx.fillRect(item.xcoord-1,item.ycoord-7,2,14);
        }
    };
    
    var idraw = function(){
            data.maxValue = 0;
            data.maxPotential = 0;
            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < data.dots.length; ++i) 
                {
                    data.dots[i] = new Dot(0,0,0,false,0);
                }
            drawForces();
            for (var i = 0; i < data.allItems.length; ++i)
                {
                    drawItem(data.allItems[i]);
                }
            showCoordinates('---','---');
    };
    
    var zeroForces = function(){
            var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < canvas.width; i+=DotsDensity)
                {
                    for (var j = 0; j < canvas.height; j+=DotsDensity)
                        {
                            drawPixel(i,j,255,255,255,100);
                        }
                }
            ctx.putImageData(canvasData, 0, 0);
            function drawPixel (x, y, r, g, b, a) {
            var index = (x + y * canvas.width) * 4;
            var index2 = (x + (y+1)* canvas.width) * 4;
            canvasData.data[index + 0] = r;
            canvasData.data[index + 1] = g;
            canvasData.data[index + 2] = b;
            canvasData.data[index + 3] = a;
            canvasData.data[index + 4] = r;
            canvasData.data[index + 5] = g;
            canvasData.data[index + 6] = b;
            canvasData.data[index + 7] = a;
            canvasData.data[index2 + 0] = r;
            canvasData.data[index2 + 1] = g;
            canvasData.data[index2 + 2] = b;
            canvasData.data[index2 + 3] = a;
            canvasData.data[index2 + 4] = r;
            canvasData.data[index2 + 5] = g;
            canvasData.data[index2 + 6] = b;
            canvasData.data[index2 + 7] = a;
            }
    };
    
    var calculateForces = function(){
        data.maxValue = 0;
        let counter = 0;
        for (var i = 0; i < canvas.width; i+=DotsDensity)
                {
                    for (var j = 0; j < canvas.height; j+=DotsDensity)
                        {
                            for (var k=0; k < data.allItems.length; k++)
                                {
                                    calculateDotPerItem(i,j,counter,data.allItems[k]);
                                }
                            if (data.currentItem){
                                calculateDotPerItem(i,j,counter,data.currentItem);
                            }
                            counter++;
                        }
                }
    };
    
    var calculateDotPerItem = function(i,j,counter,item){
        var distance = Math.pow(i-item.xcoord,2) + Math.pow(j-item.ycoord,2);
         if (Math.sqrt(distance) > 50 && !data.dots[counter].deactivate){
             var length = item.value/distance;
             var ePotential = item.value/Math.sqrt(distance);
             if (item.type === "neg") ePotential = -ePotential;
             var scalable = length/Math.sqrt(distance);
             var distanceX = (item.xcoord - i)*scalable;
             var distanceY = (item.ycoord - j)*scalable;
             if (item.type === "pos"){
                 distanceX=-distanceX;
                 distanceY=-distanceY;
             }
             data.dots[counter].x_dist += distanceX;
             data.dots[counter].y_dist += distanceY;
             data.dots[counter].leng = Math.sqrt(data.dots[counter].x_dist*data.dots[counter].x_dist+data.dots[counter].y_dist*data.dots[counter].y_dist);
             data.dots[counter].deactivate = false;
             data.dots[counter].potential += ePotential;
            if (data.dots[counter].leng > data.maxValue) {
                 data.maxValue = data.dots[counter].leng;
             }
            if (Math.abs(data.dots[counter].potential) > data.maxPotential ){
                data.maxPotential = Math.abs(data.dots[counter].potential);
            }
         } else {
             data.dots[counter].x_dist = 0;
             data.dots[counter].y_dist = 0;
             data.dots[counter].leng = 0;
             data.dots[counter].deactivate = true; 
             data.dots[counter].potential = 0; 
         }    
    };
    
    var drawForces = function(){
        if (data.allItems.length === 0 && data.currentItem === null){
            zeroForces();
        }
        else {
            //Worker
            calculateForces();
            var counter = 0;
            for (var i = 0; i < canvas.width; i+=DotsDensity)
                    {
                        for (var j = 0; j < canvas.height; j+=DotsDensity)
                            {   
                                var scale = data.dots[counter].leng/data.maxValue*40;
                                var x_coord = i + scale*data.dots[counter].x_dist/data.dots[counter].leng;
                                var y_coord = j + scale*data.dots[counter].y_dist/data.dots[counter].leng;
                                var color = data.dots[counter].potential/data.maxPotential;
                                if (color >= 0){
                                    var r = 255+2*color*(0-255);
                                    var g = 255+2*color*(138-255);
                                    var b = 255+2*color*(230-255);
                                    r>255?255:r;
                                    g>255?255:g;
                                    b>255?255:b;
                                    r<0?0:r;
                                    g<138?138:g;
                                    b<230?230:b;
                                    
                                }
                                else {
                                    color = -color;
                                    var r = 255+2*color*(222-255);
                                    var g = 255+2*color*(11-255);
                                    var b = 255+2*color*(11-255);
                                    r>255?255:r;
                                    g>255?255:g;
                                    b>255?255:b;
                                    r<222?222:r;
                                    g<11?11:g;
                                    b<11?11:b;
                                }
                                ctx.beginPath();
                                ctx.moveTo(i,j);
                                ctx.lineTo(x_coord,y_coord);
                                ctx.strokeStyle = 'rgb('+r+','+g+','+b+')';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                                counter++;
                            }
                    }
            }
    };
    
    var showCoordinates = function(x,y){
        document.querySelector('.coordinates__x').innerHTML = 'X = '+x;
        document.querySelector('.coordinates__y').innerHTML = 'Y = '+y;
          
    };
    
    return{
        drawInit: function(){
            idraw();
        },
        
        setItem: function(type, val){
            var newItem,ID;
            if (data.allItems.length > 0){
                ID = data.allItems[data.allItems.length-1].id+1;
            }
            else {
                ID = 0;
            }
            newItem = new Item(ID,type,val);
            
            data.currentItem = newItem;
            return newItem;
        },
        
        addItem: function(){
            var item = data.currentItem;
            if (data.allItems.length < 15){
                data.allItems.push(data.currentItem);
                data.currentItem = null;
                return item;
            }
            else {
                alert("Limit obiektów: 15");
                return null;
            }
        },
        
        getCurrentItem: function(){
            return data.currentItem;
        },
        
        drawItem: function(coordX,coordY){
            data.currentItem.xcoord = coordX;
            data.currentItem.ycoord = coordY;
            idraw();
            drawItem(data.currentItem);
        },
        
        deleteItems: function(){
            data.allItems = [];
            idraw();
        },
        
        drawCoordinates: function(x,y){
            showCoordinates(x,y);
        },
        
        deleteItem: function(id){
            var index;
            
            var ids = data.allItems.map(function(current){
                return current.id;
            });
            index = ids.indexOf(id);
            if (index !== -1){
                data.allItems.splice(index,1);
            }
        },
        
        setColor: function(id){
            var index,item;
            idraw();
            var ids = data.allItems.map(function(current){
                return current.id;
            });
            index = ids.indexOf(id);
            if (index !== -1){
                item = data.allItems[index];
                ctx.beginPath();
                ctx.arc(item.xcoord,item.ycoord,17,0, 2 * Math.PI);
                ctx.fillStyle = '#990000';
                ctx.strokeStyle = '#990000';
                ctx.fill();
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(item.xcoord-7,item.ycoord-1,14,2);
                if (item.type === "pos"){
                    ctx.fillRect(item.xcoord-1,item.ycoord-7,2,14);
                    }
                }
            data.selectedItem = true;
        },
        
        unsetColor: function(){
            idraw();
            data.selectedItem = false;
        },
        
        isColorSet: function(){
            return data.selectedItem;    
        },

        init: function(height,width){
            data.dots = new Array(parseInt(width/DotsDensity+1)*parseInt(height/DotsDensity+1));
            data.width = width;
            data.height = height;
        }
    }
})();

var controller = (function(UICtrl, CvsCtrl){
    var rectX,rectY;
    
    var DOM = UICtrl.getDOMStrings();
    
    var ctrlAddItem = function(){
        //1.Get values from fields
        var input = UICtrl.getInput();
        if (input !== undefined)
            {
                //2.Add item to CanvasCtrl
                var newItem = CvsCtrl.setItem(input.type,input.charge);
                //3.Calculate forces

                //4.Display on canvas
                
            }  
    };
    
    var ctrlDeleteItem = function(event){
        var itemID,ID;
        itemID = event.target.closest('.item').id;
        if (itemID){
            ID = itemID.split('-')[1];
            ID = parseInt(ID);
            //1. Delete item from the data structure
            CvsCtrl.deleteItem(ID);
            //2. Delete item from the UI
            UICtrl.deleteListItem(itemID);
            //3. Reload Canvas
            CvsCtrl.drawInit();
        }
    };
    
    var setupEventListners = function(){
        document.querySelector(DOM.add_btn).addEventListener('click',ctrlAddItem);

        document.addEventListener('keypress',function(event){
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
                if (event.clientX >= rectX && event.clientX <= rectX && event.clientY >= rectY && event.clientY <= rectY){
                    CvsCtrl.drawItem(event.clientX - rectX, event.clientY - rectY);
                }
            }
        });

        document.querySelector(DOM.refresh_btn).addEventListener('click',function(){
           //1. Delete items from CancasCtrl
            CvsCtrl.deleteItems();
            //2. Delete items on UICtrl
            UICtrl.deleteListItems();
        });

        document.getElementById(DOM.board).addEventListener('mousedown',function(){
            if (CvsCtrl.getCurrentItem())
                {
                    var item = CvsCtrl.addItem();
                    //1.Add item to the UI (if holding an object)
                    if (item){
                        UICtrl.addListItem(item);
                    }
                }
        });

        document.getElementById(DOM.board).addEventListener('mousemove',function(event){
            if (CvsCtrl.getCurrentItem())
                {
                    //1.changing coordinates of item in CanvasCtrl
                    CvsCtrl.drawItem(event.clientX - rectX, event.clientY - rectY);
                    //2.Recalculating forces

                    //3.Display on Canvas
                }
            //4.Displaying coordinates
            CvsCtrl.drawCoordinates(event.clientX - rectX, event.clientY - rectY);
        });
    
        
        document.querySelector(DOM.left).addEventListener('mousemove',function(){
            CvsCtrl.drawCoordinates('---','---'); 
        });
        
        document.querySelector(DOM.itemContainer).addEventListener('click', ctrlDeleteItem);
        
        document.querySelector(DOM.itemContainer).addEventListener('mouseover',function(event){
            itemID = event.target.closest('.item').id;
            if (itemID){
                ID = itemID.split('-')[1];
                ID = parseInt(ID);
                CvsCtrl.setColor(ID);
            }
        });
        
        document.querySelector(DOM.left).addEventListener('mouseover',function(event){
            var trgt = event.target.className
            if ((trgt == 'left' || trgt == 'left__container') && CvsCtrl.isColorSet()){
                CvsCtrl.unsetColor();
            } 
        });
    };
    
    return {
        init: function(){
            var canvas = document.getElementsByTagName('canvas')[0];
            canvas.width = parseInt(0.74 * window.innerWidth);
            canvas.height = window.innerHeight - 100;
            CvsCtrl.init(canvas.height,canvas.width);
            document.querySelector('body').style.backgroundColor = '#1a1a1a';
            console.log('Application has started');
            setupEventListners();
            CvsCtrl.drawInit();
            var rect = document.getElementById(DOM.board).getBoundingClientRect();
            rectX = parseInt(rect.left);
            rectY = parseInt(rect.top);
        },
    }
    
})(UIController,CanvasController);


controller.init();